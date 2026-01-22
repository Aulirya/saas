import { DateTime, RecordId, surql, Surreal, Table } from "surrealdb";
import { ORPCError } from "@orpc/server";
import type { LessonProgressModel } from "../repository/model/course_progress";
import type { LessonModel } from "../repository/model/lessons";
import { verifyCourseProgressOwnership } from "../utils/course_progress";
import { generateScheduleDates, getSlotDuration } from "../utils/schedule";

export async function generateLessonProgressSchedule(params: {
    db: Surreal;
    userId: RecordId;
    courseProgressId: RecordId;
    options?: {
        handle_long_lessons?: "split" | "reduce_duration";
        regenerate_existing?: boolean;
    };
}): Promise<{
    success: boolean;
    generated: number;
    warnings: Array<{ lesson_id: string; message: string }>;
}> {
    const { db, userId, courseProgressId, options } = params;
    const courseProgress = await verifyCourseProgressOwnership(
        db,
        courseProgressId,
        userId
    );

    if (
        !courseProgress.recurring_schedule ||
        courseProgress.recurring_schedule.length === 0
    ) {
        throw new ORPCError("INVALID_REQUEST", {
            message: "Aucun créneau horaire récurrent configuré pour ce cours",
        });
    }

    const subjectQuery = surql`
        SELECT *,
            (SELECT * FROM lessons
            WHERE subject_id = ${courseProgress.subject_id}
            AND user_id = ${userId}
            ORDER BY order ASC
            ) AS lessons
        FROM subjects
        WHERE id = ${courseProgress.subject_id}
        AND user_id = ${userId}
    `;

    const subjectResult = await db
        .query<
            [
                Array<{
                    lessons?: LessonModel[];
                }>
            ]
        >(subjectQuery)
        .collect();
    const lessons = subjectResult[0]?.[0]?.lessons || [];

    if (lessons.length === 0) {
        throw new ORPCError("INVALID_REQUEST", {
            message: "Aucune leçon trouvée pour cette matière",
        });
    }

    const totalHoursNeeded = lessons.reduce((sum, lesson) => {
        return sum + (lesson.duration || 60) / 60;
    }, 0);

    const scheduleDates = generateScheduleDates(
        courseProgress.recurring_schedule,
        totalHoursNeeded
    );

    const existingLessonProgressQuery = surql`
        SELECT * FROM lesson_progress
        WHERE course_progress_id = ${courseProgressId}
    `;

    const existingLessonProgress = await db
        .query<[LessonProgressModel[]]>(existingLessonProgressQuery)
        .collect();

    const shouldRegenerate = options?.regenerate_existing === true;
    if (shouldRegenerate) {
        const deleteScheduledQuery = surql`
            DELETE lesson_progress
            WHERE course_progress_id = ${courseProgressId}
            AND status = "scheduled"
        `;
        await db.query(deleteScheduledQuery).collect();
    }

    const existingByLessonId = shouldRegenerate
        ? new Map<string, LessonProgressModel>()
        : new Map(
              existingLessonProgress[0]?.map((lp) => [
                  lp.lesson_id.toString(),
                  lp,
              ]) || []
          );

    const warnings: Array<{ lesson_id: string; message: string }> = [];
    let generated = 0;
    let scheduleIndex = 0;
    let lessonIndex = 0;

    const lessonRemainingHours = lessons.map(
        (lesson) => (lesson.duration || 60) / 60
    );

    while (
        scheduleIndex < scheduleDates.length &&
        lessonIndex < lessons.length
    ) {
        const currentSlot = scheduleDates[scheduleIndex];
        const slotDuration = getSlotDuration(
            currentSlot.startHour,
            currentSlot.endHour
        );
        let slotRemainingHours = slotDuration;

        while (slotRemainingHours > 0 && lessonIndex < lessons.length) {
            const lesson = lessons[lessonIndex];
            const lessonId = lesson.id;
            const remainingHours = lessonRemainingHours[lessonIndex];
            const slotOffsetHours = slotDuration - slotRemainingHours;

            const existingProgress = existingByLessonId.get(
                lessonId.toString()
            );
            if (existingProgress && !shouldRegenerate) {
                if (existingProgress.scheduled_date) {
                    const scheduledDate = new Date(
                        existingProgress.scheduled_date.toString()
                    );
                    if (scheduledDate > new Date()) {
                        lessonIndex++;
                        continue;
                    }
                }
            }

            if (remainingHours <= slotRemainingHours) {
                const scheduledDate = new Date(currentSlot.date);
                const scheduledMinutes = Math.round((slotOffsetHours % 1) * 60);
                scheduledDate.setHours(
                    currentSlot.startHour + Math.floor(slotOffsetHours),
                    scheduledMinutes,
                    0,
                    0
                );
                const scheduledDurationMinutes = Math.round(
                    remainingHours * 60
                );

                if (existingProgress && !shouldRegenerate) {
                    await db
                        .update<LessonProgressModel>(existingProgress.id)
                        .merge({
                            scheduled_date: new DateTime(scheduledDate),
                            scheduled_duration: scheduledDurationMinutes,
                            status: "scheduled",
                            updated_at: new DateTime(),
                        });
                } else {
                    const lessonProgressTable = new Table("lesson_progress");
                    await db
                        .create<LessonProgressModel>(lessonProgressTable)
                        .content({
                            lesson_id: lessonId,
                            course_progress_id: courseProgressId,
                            status: "scheduled",
                            scheduled_date: new DateTime(scheduledDate),
                            scheduled_duration: scheduledDurationMinutes,
                            comments: [],
                        });
                }

                generated++;
                slotRemainingHours -= remainingHours;
                lessonRemainingHours[lessonIndex] = 0;
                lessonIndex++;
            } else {
                if (options?.handle_long_lessons === "reduce_duration") {
                    warnings.push({
                        lesson_id: lessonId.toString(),
                        message: `La durée de la leçon (${remainingHours}h) dépasse le créneau disponible (${slotRemainingHours}h). La durée sera réduite.`,
                    });

                    const scheduledDate = new Date(currentSlot.date);
                    const scheduledMinutes = Math.round(
                        (slotOffsetHours % 1) * 60
                    );
                    scheduledDate.setHours(
                        currentSlot.startHour + Math.floor(slotOffsetHours),
                        scheduledMinutes,
                        0,
                        0
                    );
                    const scheduledDurationMinutes = Math.round(
                        slotRemainingHours * 60
                    );

                    if (existingProgress && !shouldRegenerate) {
                        await db
                            .update<LessonProgressModel>(existingProgress.id)
                            .merge({
                                scheduled_date: new DateTime(scheduledDate),
                                scheduled_duration: scheduledDurationMinutes,
                                status: "scheduled",
                                updated_at: new DateTime(),
                            });
                    } else {
                        const lessonProgressTable = new Table(
                            "lesson_progress"
                        );
                        await db
                            .create<LessonProgressModel>(lessonProgressTable)
                            .content({
                                lesson_id: lessonId,
                                course_progress_id: courseProgressId,
                                status: "scheduled",
                                scheduled_date: new DateTime(scheduledDate),
                                scheduled_duration: scheduledDurationMinutes,
                                comments: [],
                            });
                    }

                    generated++;
                    lessonRemainingHours[lessonIndex] = 0;
                    lessonIndex++;
                    slotRemainingHours = 0;
                } else {
                    const hoursToSchedule = slotRemainingHours;
                    const scheduledDate = new Date(currentSlot.date);
                    const scheduledMinutes = Math.round(
                        (slotOffsetHours % 1) * 60
                    );
                    scheduledDate.setHours(
                        currentSlot.startHour + Math.floor(slotOffsetHours),
                        scheduledMinutes,
                        0,
                        0
                    );
                    const scheduledDurationMinutes = Math.round(
                        hoursToSchedule * 60
                    );

                    if (existingProgress && !shouldRegenerate) {
                        await db
                            .update<LessonProgressModel>(existingProgress.id)
                            .merge({
                                scheduled_date: new DateTime(scheduledDate),
                                scheduled_duration: scheduledDurationMinutes,
                                status: "scheduled",
                                updated_at: new DateTime(),
                            });
                    } else {
                        const lessonProgressTable = new Table(
                            "lesson_progress"
                        );
                        await db
                            .create<LessonProgressModel>(lessonProgressTable)
                            .content({
                                lesson_id: lessonId,
                                course_progress_id: courseProgressId,
                                status: "scheduled",
                                scheduled_date: new DateTime(scheduledDate),
                                scheduled_duration: scheduledDurationMinutes,
                                comments: [],
                            });
                    }

                    generated++;
                    lessonRemainingHours[lessonIndex] -= hoursToSchedule;
                    slotRemainingHours = 0;

                    if (lessonRemainingHours[lessonIndex] > 0) {
                        warnings.push({
                            lesson_id: lessonId.toString(),
                            message:
                                "La leçon sera répartie sur plusieurs créneaux",
                        });
                    } else {
                        lessonIndex++;
                    }
                }
            }
        }

        scheduleIndex++;
    }

    while (lessonIndex < lessons.length) {
        const lesson = lessons[lessonIndex];
        warnings.push({
            lesson_id: lesson.id.toString(),
            message: "Pas assez de créneaux disponibles pour cette leçon",
        });
        lessonIndex++;
    }

    await db.update(courseProgressId).merge({
        auto_scheduled: true,
        updated_at: new DateTime(),
    });

    console.log("generated", generated);
    return {
        success: true,
        generated,
        warnings,
    };
}
