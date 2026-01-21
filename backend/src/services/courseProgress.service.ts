import { DateTime, RecordId, surql, Surreal, Table } from "surrealdb";
import { ORPCError } from "@orpc/server";
import type {
    CourseProgressModel,
    LessonProgressModel,
} from "../repository/model/course_progress";

import {
    CourseProgressMapper,
    LessonProgressMapper,
} from "../repository/mapper/course_progress";

import type {
    CourseProgress,
    CourseProgressWithLessons,
    RecurringScheduleSlot,
    SubjectCategory,
} from "@saas/shared";
import { verifyCourseProgressOwnership } from "../utils/course_progress";
import type { RecurringScheduleSlotWithDateTime } from "../utils/schedule";

export async function listCourseProgress(params: {
    db: Surreal;
    userId: RecordId;
    classId?: RecordId | null;
    subjectId?: RecordId | null;
}): Promise<CourseProgress[]> {
    const { db, userId, classId, subjectId } = params;
    try {
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

        const result = await db.query<[CourseProgressModel[]]>(query).collect();
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
}

export async function getCourseProgress(params: {
    db: Surreal;
    userId: RecordId;
    courseProgressId: RecordId;
}): Promise<CourseProgress> {
    const { db, userId, courseProgressId } = params;
    const courseProgress = await verifyCourseProgressOwnership(
        db,
        courseProgressId,
        userId
    );

    return CourseProgressMapper.fromModel(courseProgress);
}

export async function getCourseProgressWithLessons(params: {
    db: Surreal;
    userId: RecordId;
    courseProgressId: RecordId;
}): Promise<CourseProgressWithLessons> {
    const { db, userId, courseProgressId } = params;
    await verifyCourseProgressOwnership(db, courseProgressId, userId);

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

    const result = await db
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

    const courseProgress = CourseProgressMapper.fromModel(courseProgressData);
    const lessonProgress =
        courseProgressData.lesson_progress?.map(
            LessonProgressMapper.fromModel
        ) ?? [];

    return {
        ...courseProgress,
        lesson_progress: lessonProgress,
    };
}

export async function getAllLessonsForCalendar(params: {
    db: Surreal;
    userId: RecordId;
}): Promise<
    Array<
        LessonProgressModel & {
            subject_name?: string;
            class_name?: string;
            lesson_label?: string;
            class_level?: string;
            subject_category?: string;
        }
    >
> {
    const { db } = params;

    // Now get the lessons with subject and class names via links
    const lessonsQuery = surql`
        SELECT *,
            course_progress_id.subject_id.name AS subject_name,
            course_progress_id.subject_id.category AS subject_category,
            course_progress_id.class_id.name AS class_name,
            course_progress_id.class_id.level AS class_level,
            lesson_id.label AS lesson_label
        FROM lesson_progress
    `;

    const result = await db
        .query<
            [
                Array<
                    LessonProgressModel & {
                        subject_name?: string;
                        class_name?: string;
                        subject_category?: string;
                        class_level?: string;
                        lesson_label?: string;
                    }
                >
            ]
        >(lessonsQuery)
        .collect();

    return result[0] ?? [];
}

export async function createCourseProgress(params: {
    db: Surreal;
    userId: RecordId;
    classId: RecordId;
    subjectId: RecordId;
    status?: CourseProgress["status"];
}): Promise<CourseProgress> {
    const { db, userId, classId, subjectId, status } = params;

    const checkQuery = surql`
        SELECT * FROM course_progress 
        WHERE user_id = ${userId} 
        AND class_id = ${classId} 
        AND subject_id = ${subjectId}
    `;
    const existing = await db
        .query<[CourseProgressModel[]]>(checkQuery)
        .collect();

    if (existing[0] && existing[0].length > 0) {
        throw new ORPCError("INVALID_REQUEST", {
            message: "Un cours existe déjà pour cette classe et cette matière",
        });
    }

    const classQuery = surql`
        SELECT * FROM classes 
        WHERE id = ${classId} AND user_id = ${userId}
    `;
    const classResult = await db
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
    const subjectResult = await db
        .query<[Array<{ id: RecordId }>]>(subjectQuery)
        .collect();

    if (!subjectResult[0] || subjectResult[0].length === 0) {
        throw new ORPCError("NOT_FOUND", {
            message: "Matière non trouvée",
        });
    }

    try {
        const courseProgressTable = new Table("course_progress");
        const result = await db
            .create<CourseProgressModel>(courseProgressTable)
            .content({
                class_id: classId,
                subject_id: subjectId,
                user_id: userId,
                status: status ?? "not_started",
            });

        return CourseProgressMapper.fromModel(result[0]);
    } catch (e) {
        console.error("error in createCourseProgress: ", e);
        throw new ORPCError("DATABASE_ERROR", {
            message: "Erreur lors de la création de la progression de cours",
        });
    }
}

export async function patchCourseProgress(params: {
    db: Surreal;
    userId: RecordId;
    courseProgressId: RecordId;
    input: {
        status?: CourseProgress["status"];
        auto_scheduled?: boolean;
        recurring_schedule?: RecurringScheduleSlot[];
    };
}): Promise<CourseProgress> {
    const { db, userId, courseProgressId, input } = params;
    await verifyCourseProgressOwnership(db, courseProgressId, userId);

    const updateData: Partial<CourseProgressModel> = {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.auto_scheduled !== undefined && {
            auto_scheduled: input.auto_scheduled,
        }),
        updated_at: new DateTime(),
    };

    if (input.recurring_schedule !== undefined) {
        const scheduleSlots: RecurringScheduleSlotWithDateTime[] =
            input.recurring_schedule.map((slot: RecurringScheduleSlot) => ({
                day_of_week: slot.day_of_week,
                start_hour: slot.start_hour,
                end_hour: slot.end_hour,
                start_date: new DateTime(slot.start_date),
            }));

        updateData.recurring_schedule =
            scheduleSlots as RecurringScheduleSlot[];
    }

    try {
        const result = await db
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
            message: "Erreur lors de la mise à jour de la progression de cours",
        });
    }
}

export async function deleteCourseProgress(params: {
    db: Surreal;
    userId: RecordId;
    courseProgressId: RecordId;
}): Promise<{ success: boolean }> {
    const { db, userId, courseProgressId } = params;
    await verifyCourseProgressOwnership(db, courseProgressId, userId);

    try {
        await db.query(
            surql`DELETE FROM lesson_progress WHERE course_progress_id = ${courseProgressId}`
        );

        await db.delete(courseProgressId);

        return { success: true };
    } catch (e) {
        console.error("Error deleting course progress:", e);
        throw new ORPCError("DATABASE_ERROR", {
            message: "Erreur lors de la suppression de la progression de cours",
        });
    }
}
