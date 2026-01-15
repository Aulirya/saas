import { DateTime, RecordId, surql, Surreal, Table } from "surrealdb";
import { base } from "./base";
import type {
    CourseProgressModel,
    LessonProgressModel,
} from "../repository/model/course_progress";
import {
    CourseProgressMapper,
    LessonProgressMapper,
} from "../repository/mapper/course_progress";
import z from "zod";
import { parseRecordId } from "../utils/record-id";
import {
    course_progress_create_input,
    course_progress_patch_input,
    type CourseProgress,
    type CourseProgressWithLessons,
} from "@saas/shared";
import { ORPCError } from "@orpc/server";
import type { LessonModel } from "../repository/model/lessons";

// ------- HELPERS -------
const getUserRecordId = (userId: string): RecordId =>
    new RecordId("users", userId);

// Verify course progress ownership
export async function verifyCourseProgressOwnership(
    db: Surreal,
    courseProgressId: RecordId,
    userId: RecordId
): Promise<CourseProgressModel> {
    const query = surql`
        SELECT * FROM course_progress 
        WHERE id = ${courseProgressId} 
        AND user_id = ${userId}
    `;
    const result = await db.query<[CourseProgressModel[]]>(query).collect();
    const courseProgress = result[0]?.[0];

    if (!courseProgress) {
        throw new ORPCError("NOT_FOUND", {
            message:
                "Progression de cours non trouvée ou vous n'avez pas l'autorisation d'y accéder",
        });
    }

    return courseProgress;
}

// ------- COURSE PROGRESS ENDPOINTS -------

// List all course progress for the current user
export const listCourseProgress = base
    .input(
        z.object({
            class_id: z.string().optional(),
            subject_id: z.string().optional(),
        })
    )
    .handler(async ({ input, context }): Promise<CourseProgress[]> => {
        console.log(" listCourseProgressinput", input);
        try {
            const userId = getUserRecordId(context.user_id);
            const classId = input.class_id
                ? parseRecordId(input.class_id, "classes")
                : null;
            const subjectId = input.subject_id
                ? parseRecordId(input.subject_id, "subjects")
                : null;

            // Build query conditionally based on provided filters
            let query: ReturnType<typeof surql>;
            if (classId && subjectId) {
                query = surql`SELECT * FROM course_progress WHERE user_id = ${userId} AND class_id = ${classId} AND subject_id = ${subjectId}`;
            } else if (classId) {
                query = surql`SELECT * FROM course_progress WHERE user_id = ${userId} AND class_id = ${classId}`;
            } else if (subjectId) {
                query = surql`SELECT * FROM course_progress WHERE user_id = ${userId} AND subject_id = ${subjectId}`;
            } else {
                query = surql`SELECT * FROM course_progress WHERE user_id = ${userId}`;
            }

            const result = await context.db
                .query<[CourseProgressModel[]]>(query)
                .collect();
            return result[0].map(CourseProgressMapper.fromModel);
        } catch (error) {
            console.error("Error in listCourseProgress:", error);
            throw new ORPCError("INTERNAL_ERROR", {
                message:
                    error instanceof Error
                        ? error.message
                        : "Une erreur est survenue lors du listage des progressions de cours",
            });
        }
    });

// Get a course progress by ID
export const getCourseProgress = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<CourseProgress> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        const courseProgress = await verifyCourseProgressOwnership(
            context.db,
            courseProgressId,
            userId
        );

        return CourseProgressMapper.fromModel(courseProgress);
    });

// Get course progress with lesson progress
export const getCourseProgressWithLessons = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<CourseProgressWithLessons> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        // Verify ownership
        await verifyCourseProgressOwnership(
            context.db,
            courseProgressId,
            userId
        );

        // Get course progress with lesson progress
        const query = surql`
                SELECT *,
                    (
                        SELECT * FROM lesson_progress
                        WHERE course_progress_id =  ${courseProgressId}
                        ORDER BY created_at ASC
                    ) AS lesson_progress
                FROM course_progress
                WHERE id = ${courseProgressId}
            `;

        const result = await context.db
            .query<
                [
                    Array<
                        CourseProgressModel & {
                            lesson_progress?: LessonProgressModel[];
                        }
                    >
                ]
            >(query)
            .collect();

        const courseProgressData = result[0]?.[0];
        if (!courseProgressData) {
            throw new ORPCError("NOT_FOUND", {
                message: "Progression de cours non trouvée",
            });
        }

        const courseProgress =
            CourseProgressMapper.fromModel(courseProgressData);
        const lessonProgress =
            courseProgressData.lesson_progress?.map(
                LessonProgressMapper.fromModel
            ) ?? [];

        return {
            ...courseProgress,
            lesson_progress: lessonProgress,
        };
    });

// Create course progress
export const createCourseProgress = base
    .input(course_progress_create_input)
    .handler(async ({ input, context }): Promise<CourseProgress> => {
        const userId = getUserRecordId(context.user_id);
        const classId = parseRecordId(input.class_id, "classes");
        const subjectId = parseRecordId(input.subject_id, "subjects");

        // Check if course progress already exists
        const checkQuery = surql`
            SELECT * FROM course_progress 
            WHERE user_id = ${userId} 
            AND class_id = ${classId} 
            AND subject_id = ${subjectId}
        `;
        const existing = await context.db
            .query<[CourseProgressModel[]]>(checkQuery)
            .collect();

        if (existing[0] && existing[0].length > 0) {
            throw new ORPCError("INVALID_REQUEST", {
                message:
                    "Un cours existe déjà pour cette classe et cette matière",
            });
        }

        // Verify class and subject belong to user
        const classQuery = surql`
            SELECT * FROM classes 
            WHERE id = ${classId} AND user_id = ${userId}
        `;
        const classResult = await context.db
            .query<[Array<{ id: RecordId }>]>(classQuery)
            .collect();

        if (!classResult[0] || classResult[0].length === 0) {
            throw new ORPCError("NOT_FOUND", {
                message: "Classe non trouvée",
            });
        }

        const subjectQuery = surql`
            SELECT * FROM subjects 
            WHERE id = ${subjectId} AND user_id = ${userId}
        `;
        const subjectResult = await context.db
            .query<[Array<{ id: RecordId }>]>(subjectQuery)
            .collect();

        if (!subjectResult[0] || subjectResult[0].length === 0) {
            throw new ORPCError("NOT_FOUND", {
                message: "Matière non trouvée",
            });
        }

        try {
            const courseProgressTable = new Table("course_progress");
            const result = await context.db
                .create<CourseProgressModel>(courseProgressTable)
                .content({
                    class_id: classId,
                    subject_id: subjectId,
                    user_id: userId,
                    status: input.status ?? "not_started",
                });

            return CourseProgressMapper.fromModel(result[0]);
        } catch (e) {
            console.error("error in createCourseProgress: ", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Erreur lors de la création de la progression de cours",
            });
        }
    });

// ---------- HELPER FUNCTIONS FOR PATCH COURSE PROGRESS ----------

// Add a new API endpoint for checking conflicts without saving
// backend/src/router/course_progress.ts
export const checkScheduleConflictsOnly = base
    .input(
        z.object({
            course_progress_id: z.string(),
            recurring_schedule: z.array(
                z.object({
                    day_of_week: z.number(),
                    start_hour: z.number(),
                    end_hour: z.number(),
                    start_date: z.string(),
                })
            ),
        })
    )
    .handler(async ({ input, context }) => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(
            input.course_progress_id,
            "course_progress"
        );

        // Verify ownership
        await verifyCourseProgressOwnership(
            context.db,
            courseProgressId,
            userId
        );

        const scheduleSlots = input.recurring_schedule.map((slot) => ({
            day_of_week: slot.day_of_week,
            start_hour: slot.start_hour,
            end_hour: slot.end_hour,
            start_date: new DateTime(slot.start_date),
        }));

        const conflicts = await checkScheduleConflicts(
            context.db,
            userId,
            courseProgressId,
            scheduleSlots
        );

        return { conflicts };
    });

// Helper function to check for schedule conflicts
async function checkScheduleConflicts(
    db: Surreal,
    userId: RecordId,
    courseProgressId: RecordId,
    recurringSchedule: Array<{
        day_of_week: number;
        start_hour: number;
        end_hour: number;
        start_date: DateTime;
    }>
): Promise<Array<{ conflict: boolean; message: string; slot: any }>> {
    const conflicts: Array<{ conflict: boolean; message: string; slot: any }> =
        [];

    // Helper function to check if two time slots overlap
    const timesOverlap = (
        start1: number,
        end1: number,
        start2: number,
        end2: number
    ): boolean => {
        return (
            (start1 >= start2 && start1 < end2) ||
            (end1 > start2 && end1 <= end2) ||
            (start1 <= start2 && end1 >= end2)
        );
    };

    // STEP 1: Check for conflicts within the same course_progress (internal conflicts)
    for (let i = 0; i < recurringSchedule.length; i++) {
        for (let j = i + 1; j < recurringSchedule.length; j++) {
            const slot1 = recurringSchedule[i];
            const slot2 = recurringSchedule[j];

            // Check if same day of week and times overlap
            if (
                slot1.day_of_week === slot2.day_of_week &&
                timesOverlap(
                    slot1.start_hour,
                    slot1.end_hour,
                    slot2.start_hour,
                    slot2.end_hour
                )
            ) {
                conflicts.push({
                    conflict: true,
                    message: `Conflit interne: deux créneaux se chevauchent le ${getDayName(
                        slot1.day_of_week
                    ).toLowerCase()} (${slot1.start_hour}h-${slot1.end_hour}h)`,
                    slot: slot1,
                });
            }
        }
    }

    // STEP 2: Check for conflicts with other course_progress (external conflicts)
    try {
        // Get all course progress for this user with subject information
        const allCourseProgressQuery = surql`
            SELECT
                id,
                recurring_schedule,
                subject_id
            FROM course_progress
            WHERE user_id = ${userId}
            AND id != ${courseProgressId}
        `;
        const allCourseProgressResult = await db
            .query<
                [
                    Array<{
                        id: RecordId;
                        subject_id: RecordId;
                        recurring_schedule?: Array<{
                            day_of_week: number;
                            start_hour: number;
                            end_hour: number;
                            start_date: DateTime;
                        }>;
                    }>
                ]
            >(allCourseProgressQuery)
            .collect();

        const allCourseProgress = allCourseProgressResult[0] || [];

        // Get subject names for better error messages
        const subjectIds = [
            ...new Set(
                allCourseProgress
                    .map((cp) => cp.subject_id)
                    .filter((id) => id !== undefined) as RecordId[]
            ),
        ];

        const subjectNamesMap = new Map<string, string>();
        if (subjectIds.length > 0) {
            // Fetch subjects one by one or use a different approach
            // For now, we'll fetch them individually to avoid SQL syntax issues

            for (const subjectId of subjectIds) {
                let id = subjectId.toString();

                const subjectQuery = surql`
                    SELECT id, name FROM subjects
                    WHERE id = ${subjectId}
                `;
                const subjectResult = await db
                    .query<
                        [
                            Array<{
                                id: string;
                                name: string;
                            }>
                        ]
                    >(subjectQuery)
                    .collect();

                const subjects = subjectResult[0] || [];
                if (subjects.length > 0) {
                    subjectNamesMap.set(
                        subjects[0].id.toString(),
                        subjects[0].name
                    );
                }
            }
        }

        // Check each new slot against existing schedules from other course_progress
        for (const newSlot of recurringSchedule) {
            for (const otherCp of allCourseProgress) {
                const otherSchedules = otherCp.recurring_schedule || [];

                const subjectName =
                    subjectNamesMap.get(otherCp.subject_id.toString()) ||
                    "cours inconnu";

                for (const existingSlot of otherSchedules) {
                    // Check if same day of week and times overlap
                    if (
                        existingSlot.day_of_week === newSlot.day_of_week &&
                        timesOverlap(
                            newSlot.start_hour,
                            newSlot.end_hour,
                            existingSlot.start_hour,
                            existingSlot.end_hour
                        )
                    ) {
                        conflicts.push({
                            conflict: true,
                            message: `Conflit avec le cours "${subjectName}" le ${getDayName(
                                newSlot.day_of_week
                            )} de ${existingSlot.start_hour}h à ${
                                existingSlot.end_hour
                            }h \n`,
                            slot: newSlot,
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error(
            "Erreur lors de la récupération/créneau des autres cours :",
            err
        );
    }

    return conflicts;
}

function getDayName(dayOfWeek: number): string {
    const days = [
        "",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
    ];
    return days[dayOfWeek] || "";
}

// Helper function to calculate slot duration in hours
function getSlotDuration(startHour: number, endHour: number): number {
    return endHour - startHour;
}

// Helper function to get next occurrence of a day of week from a start date
function getNextOccurrence(startDate: Date, dayOfWeek: number): Date {
    const date = new Date(startDate);
    const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to our format (1 = Monday, 7 = Sunday)
    const currentDayOfWeek = currentDay === 0 ? 7 : currentDay;

    let daysToAdd = dayOfWeek - currentDayOfWeek;
    if (daysToAdd < 0) {
        daysToAdd += 7;
    }
    if (daysToAdd === 0 && date <= new Date()) {
        daysToAdd = 7; // If today is the day but time has passed, go to next week
    }

    date.setDate(date.getDate() + daysToAdd);
    return date;
}

// Helper function to generate dates for lessons based on recurring schedule
function generateScheduleDates(
    recurringSchedule: Array<{
        day_of_week: number;
        start_hour: number;
        end_hour: number;
        start_date: DateTime;
    }>,
    totalHoursNeeded: number
): Array<{
    date: Date;
    startHour: number;
    endHour: number;
    slotIndex: number;
}> {
    const scheduleDates: Array<{
        date: Date;
        startHour: number;
        endHour: number;
        slotIndex: number;
    }> = [];

    // Sort slots by day of week and start hour
    const sortedSlots = [...recurringSchedule].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week;
        }
        return a.start_hour - b.start_hour;
    });

    let totalHoursScheduled = 0;
    let currentWeek = 0;
    const startDates = sortedSlots.map(
        (slot) => new Date(slot.start_date.toString())
    );

    while (totalHoursScheduled < totalHoursNeeded) {
        for (let slotIndex = 0; slotIndex < sortedSlots.length; slotIndex++) {
            if (totalHoursScheduled >= totalHoursNeeded) break;

            const slot = sortedSlots[slotIndex];
            const slotStartDate = startDates[slotIndex];
            const slotDuration = getSlotDuration(
                slot.start_hour,
                slot.end_hour
            );

            // Calculate the date for this occurrence
            const baseDate = new Date(slotStartDate);
            baseDate.setDate(baseDate.getDate() + currentWeek * 7);
            const occurrenceDate = getNextOccurrence(
                baseDate,
                slot.day_of_week
            );

            // Adjust for the week offset
            if (currentWeek > 0) {
                occurrenceDate.setDate(
                    occurrenceDate.getDate() + currentWeek * 7
                );
            }

            scheduleDates.push({
                date: occurrenceDate,
                startHour: slot.start_hour,
                endHour: slot.end_hour,
                slotIndex,
            });

            totalHoursScheduled += slotDuration;
        }
        currentWeek++;
    }

    return scheduleDates;
}

// Update patchCourseProgress to handle recurring_schedule
export const patchCourseProgress = base
    .input(course_progress_patch_input)
    .handler(async ({ input, context }): Promise<CourseProgress> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        await verifyCourseProgressOwnership(
            context.db,
            courseProgressId,
            userId
        );

        const updateData: Partial<CourseProgressModel> = {
            ...(input.status !== undefined && { status: input.status }),
            ...(input.auto_scheduled !== undefined && {
                auto_scheduled: input.auto_scheduled,
            }),
            updated_at: new DateTime(),
        };

        // Handle recurring_schedule
        if (input.recurring_schedule !== undefined) {
            // Check for conflicts
            const scheduleSlots = input.recurring_schedule.map((slot) => ({
                day_of_week: slot.day_of_week,
                start_hour: slot.start_hour,
                end_hour: slot.end_hour,
                start_date: new DateTime(slot.start_date),
            }));

            const conflicts = await checkScheduleConflicts(
                context.db,
                userId,
                courseProgressId,
                scheduleSlots
            );

            console.log("conflicts: ", conflicts);
            if (conflicts.length > 0) {
                const conflictMessages = conflicts
                    .map((c) => c.message)
                    .join(", ");
                throw new ORPCError("INVALID_REQUEST", {
                    message: ` ${conflictMessages}`,
                });
            }

            updateData.recurring_schedule = scheduleSlots;
        }

        try {
            const result = await context.db
                .update<CourseProgressModel>(courseProgressId)
                .merge(updateData);

            if (!result) {
                throw new ORPCError("DATABASE_ERROR", {
                    message:
                        "Erreur lors de la mise à jour de la progression de cours",
                });
            }

            return CourseProgressMapper.fromModel(result);
        } catch (e) {
            if (e instanceof ORPCError) {
                throw e;
            }
            console.error("error in patchCourseProgress: ", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Erreur lors de la mise à jour de la progression de cours",
            });
        }
    });
``;

// -------------------------------------------------------------
// ----------  LESSON PROGRESS  ----------
// -------------------------------------------------------------
// New endpoint: Generate lesson progress schedule
export const generateLessonProgressSchedule = base
    .input(
        z.object({
            course_progress_id: z.string(),
            options: z
                .object({
                    handle_long_lessons: z
                        .enum(["split", "reduce_duration"])
                        .optional()
                        .default("split"),
                    regenerate_existing: z.boolean().optional().default(false),
                })
                .optional(),
        })
    )
    .handler(
        async ({
            input,
            context,
        }): Promise<{
            success: boolean;
            generated: number;
            warnings: Array<{ lesson_id: string; message: string }>;
        }> => {
            const userId = getUserRecordId(context.user_id);
            const courseProgressId = parseRecordId(
                input.course_progress_id,
                "course_progress"
            );

            // Verify ownership
            const courseProgress = await verifyCourseProgressOwnership(
                context.db,
                courseProgressId,
                userId
            );

            if (
                !courseProgress.recurring_schedule ||
                courseProgress.recurring_schedule.length === 0
            ) {
                throw new ORPCError("INVALID_REQUEST", {
                    message:
                        "Aucun créneau horaire récurrent configuré pour ce cours",
                });
            }

            // Get subject with lessons
            const subjectQuery = surql`
            SELECT *,
                (SELECT * FROM lessons
                WHERE subject_id = ${courseProgress.subject_id}
                ORDER BY order ASC
                ) AS lessons
            FROM subjects
            WHERE id = ${courseProgress.subject_id}
        `;

            const subjectResult = await context.db
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

            // Calculate total hours needed
            const totalHoursNeeded = lessons.reduce((sum, lesson) => {
                return sum + (lesson.duration || 60) / 60; // Convert minutes to hours
            }, 0);

            // Generate schedule dates
            const scheduleDates = generateScheduleDates(
                courseProgress.recurring_schedule,
                totalHoursNeeded
            );

            // Get existing lesson progress
            const existingLessonProgressQuery = surql`
            SELECT * FROM lesson_progress
            WHERE course_progress_id = ${courseProgressId}
        `;
            const existingLessonProgress = await context.db
                .query<[LessonProgressModel[]]>(existingLessonProgressQuery)
                .collect();

            const existingByLessonId = new Map(
                existingLessonProgress[0]?.map((lp) => [
                    lp.lesson_id.toString(),
                    lp,
                ]) || []
            );

            const warnings: Array<{ lesson_id: string; message: string }> = [];
            let generated = 0;
            let scheduleIndex = 0;

            // Create or update lesson progress for each lesson
            for (const lesson of lessons) {
                const lessonDurationHours = (lesson.duration || 60) / 60;
                const lessonId = lesson.id;

                // Check if lesson already has progress
                const existingProgress = existingByLessonId.get(
                    lessonId.toString()
                );

                // Skip if lesson progress exists and we're not regenerating
                if (existingProgress && !input.options?.regenerate_existing) {
                    // Only skip if it's in the future
                    if (existingProgress.scheduled_date) {
                        const scheduledDate = new Date(
                            existingProgress.scheduled_date.toString()
                        );
                        if (scheduledDate > new Date()) {
                            continue;
                        }
                    }
                }

                // Check if lesson duration exceeds slot duration
                const currentSlot = scheduleDates[scheduleIndex];
                if (!currentSlot) {
                    warnings.push({
                        lesson_id: lessonId.toString(),
                        message:
                            "Pas assez de créneaux disponibles pour cette leçon",
                    });
                    continue;
                }

                const slotDuration = getSlotDuration(
                    currentSlot.startHour,
                    currentSlot.endHour
                );

                if (lessonDurationHours > slotDuration) {
                    if (
                        input.options?.handle_long_lessons === "reduce_duration"
                    ) {
                        warnings.push({
                            lesson_id: lessonId.toString(),
                            message: `La durée de la leçon (${lessonDurationHours}h) dépasse le créneau (${slotDuration}h). La durée sera réduite.`,
                        });
                        // Will be handled by creating lesson progress with reduced duration
                    } else {
                        // Split across multiple slots
                        let remainingHours = lessonDurationHours;
                        let currentScheduleIndex = scheduleIndex;

                        while (
                            remainingHours > 0 &&
                            currentScheduleIndex < scheduleDates.length
                        ) {
                            const slot = scheduleDates[currentScheduleIndex];
                            const slotDuration = getSlotDuration(
                                slot.startHour,
                                slot.endHour
                            );
                            const hoursToSchedule = Math.min(
                                remainingHours,
                                slotDuration
                            );

                            const scheduledDate = new Date(slot.date);
                            scheduledDate.setHours(slot.startHour, 0, 0, 0);

                            if (
                                existingProgress &&
                                input.options?.regenerate_existing
                            ) {
                                // Update existing
                                await context.db
                                    .update<LessonProgressModel>(
                                        existingProgress.id
                                    )
                                    .merge({
                                        scheduled_date: new DateTime(
                                            scheduledDate
                                        ),
                                        status: "scheduled",
                                        updated_at: new DateTime(),
                                    });
                            } else {
                                // Create new
                                const lessonProgressTable = new Table(
                                    "lesson_progress"
                                );
                                await context.db
                                    .create<LessonProgressModel>(
                                        lessonProgressTable
                                    )
                                    .content({
                                        lesson_id: lessonId,
                                        course_progress_id: courseProgressId,
                                        status: "scheduled",
                                        scheduled_date: new DateTime(
                                            scheduledDate
                                        ),
                                        comments: [],
                                    });
                            }

                            generated++;
                            remainingHours -= hoursToSchedule;
                            currentScheduleIndex++;

                            if (remainingHours > 0) {
                                warnings.push({
                                    lesson_id: lessonId.toString(),
                                    message: `La leçon sera répartie sur plusieurs créneaux`,
                                });
                            }
                        }

                        scheduleIndex = currentScheduleIndex;
                        continue;
                    }
                }

                // Normal case: lesson fits in one slot
                const scheduledDate = new Date(currentSlot.date);
                scheduledDate.setHours(currentSlot.startHour, 0, 0, 0);

                if (existingProgress && input.options?.regenerate_existing) {
                    // Update existing
                    await context.db
                        .update<LessonProgressModel>(existingProgress.id)
                        .merge({
                            scheduled_date: new DateTime(scheduledDate),
                            status: "scheduled",
                            updated_at: new DateTime(),
                        });
                } else {
                    // Create new
                    const lessonProgressTable = new Table("lesson_progress");
                    await context.db
                        .create<LessonProgressModel>(lessonProgressTable)
                        .content({
                            lesson_id: lessonId,
                            course_progress_id: courseProgressId,
                            status: "scheduled",
                            scheduled_date: new DateTime(scheduledDate),
                            comments: [],
                        });
                }

                generated++;
                scheduleIndex++;
            }

            // Update course progress to mark as auto-scheduled
            await context.db
                .update<CourseProgressModel>(courseProgressId)
                .merge({
                    auto_scheduled: true,
                    updated_at: new DateTime(),
                });

            return {
                success: true,
                generated,
                warnings,
            };
        }
    );

// New endpoint: Preview schedule generation
export const previewLessonProgressSchedule = base
    .input(z.object({ course_progress_id: z.string() }))
    .handler(
        async ({
            input,
            context,
        }): Promise<{
            total_lessons: number;
            total_hours: number;
            weeks_needed: number;
            schedule_preview: Array<{
                lesson_label: string;
                scheduled_date: string;
                slot: string;
                duration_hours: number;
            }>;
            warnings: Array<{ lesson_id: string; message: string }>;
        }> => {
            const userId = getUserRecordId(context.user_id);
            const courseProgressId = parseRecordId(
                input.course_progress_id,
                "course_progress"
            );

            const courseProgress = await verifyCourseProgressOwnership(
                context.db,
                courseProgressId,
                userId
            );

            if (
                !courseProgress.recurring_schedule ||
                courseProgress.recurring_schedule.length === 0
            ) {
                throw new ORPCError("INVALID_REQUEST", {
                    message: "Aucun créneau horaire récurrent configuré",
                });
            }

            // Get lessons (same logic as generateLessonProgressSchedule)
            const subjectQuery = surql`
            SELECT *,
                (SELECT * FROM lessons
                WHERE subject_id = ${courseProgress.subject_id}
                ORDER BY order ASC
                ) AS lessons
            FROM subjects
            WHERE id = ${courseProgress.subject_id}
        `;

            const subjectResult = await context.db
                .query<
                    [
                        Array<{
                            lessons?: LessonModel[];
                        }>
                    ]
                >(subjectQuery)
                .collect();
            const lessons = subjectResult[0]?.[0]?.lessons || [];

            const totalHoursNeeded = lessons.reduce((sum, lesson) => {
                return sum + (lesson.duration || 60) / 60;
            }, 0);

            const scheduleDates = generateScheduleDates(
                courseProgress.recurring_schedule,
                totalHoursNeeded
            );

            const preview: Array<{
                lesson_label: string;
                scheduled_date: string;
                slot: string;
                duration_hours: number;
            }> = [];

            const warnings: Array<{ lesson_id: string; message: string }> = [];
            let scheduleIndex = 0;

            for (const lesson of lessons) {
                const lessonDurationHours = (lesson.duration || 60) / 60;
                const slot = scheduleDates[scheduleIndex];

                if (!slot) {
                    warnings.push({
                        lesson_id: lesson.id.toString(),
                        message: "Pas assez de créneaux disponibles",
                    });
                    continue;
                }

                const slotDuration = getSlotDuration(
                    slot.startHour,
                    slot.endHour
                );

                if (lessonDurationHours > slotDuration) {
                    warnings.push({
                        lesson_id: lesson.id.toString(),
                        message: `La durée (${lessonDurationHours}h) dépasse le créneau (${slotDuration}h)`,
                    });
                }

                const scheduledDate = new Date(slot.date);
                scheduledDate.setHours(slot.startHour, 0, 0, 0);

                preview.push({
                    lesson_label: lesson.label,
                    scheduled_date: scheduledDate.toISOString(),
                    slot: `${slot.startHour}h-${slot.endHour}h`,
                    duration_hours: lessonDurationHours,
                });

                scheduleIndex++;
            }

            // Calculate weeks needed
            const lastDate = scheduleDates[scheduleDates.length - 1]?.date;
            const firstDate = scheduleDates[0]?.date;
            const weeksNeeded =
                lastDate && firstDate
                    ? Math.ceil(
                          (lastDate.getTime() - firstDate.getTime()) /
                              (1000 * 60 * 60 * 24 * 7)
                      )
                    : 0;

            return {
                total_lessons: lessons.length,
                total_hours: totalHoursNeeded,
                weeks_needed: weeksNeeded,
                schedule_preview: preview,
                warnings,
            };
        }
    );

// Delete course progress
export const deleteCourseProgress = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<{ success: boolean }> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        await verifyCourseProgressOwnership(
            context.db,
            courseProgressId,
            userId
        );

        try {
            // Delete associated lesson progress first
            await context.db.query(
                surql`DELETE FROM lesson_progress WHERE course_progress_id = ${courseProgressId}`
            );

            // Delete course progress
            await context.db.delete(courseProgressId);

            return { success: true };
        } catch (e) {
            console.error("Error deleting course progress:", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Erreur lors de la suppression de la progression de cours",
            });
        }
    });
