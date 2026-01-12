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
    lesson_progress_create_input,
    lesson_progress_patch_input,
    type CourseProgress,
    type CourseProgressWithLessons,
    type LessonProgress,
} from "@saas/shared";
import { ORPCError } from "@orpc/server";
import type { LessonModel } from "../repository/model/lessons";

// ------- HELPERS -------
const getUserRecordId = (userId: string): RecordId =>
    new RecordId("users", userId);

// Verify course progress ownership
async function verifyCourseProgressOwnership(
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
            class_id: z.string(),
            subject_id: z.string(),
        })
    )
    .handler(async ({ input, context }): Promise<CourseProgress[]> => {
        const userId = getUserRecordId(context.user_id);
        const classId = parseRecordId(input.class_id, "classes");
        const subjectId = parseRecordId(input.subject_id, "subjects");
        const query = surql`SELECT * FROM course_progress WHERE user_id = ${userId} AND class_id = ${classId} AND subject_id = ${subjectId}`;

        const result = await context.db
            .query<[CourseProgressModel[]]>(query)
            .collect();
        return result[0].map(CourseProgressMapper.fromModel);
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
                        WHERE course_progress_id = $parent.id
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

// Get course progress by class and subject
export const getCourseProgressByClassAndSubject = base
    .input(
        z.object({
            class_id: z.string(),
            subject_id: z.string(),
        })
    )
    .handler(async ({ input, context }): Promise<CourseProgressWithLessons> => {
        const userId = getUserRecordId(context.user_id);
        const classId = parseRecordId(input.class_id, "classes");
        const subjectId = parseRecordId(input.subject_id, "subjects");

        // Get course progress with lesson progress
        const query = surql`
                SELECT *,
                    (
                        SELECT * FROM lesson_progress
                        WHERE course_progress_id = $parent.id
                        ORDER BY created_at ASC
                    ) AS lesson_progress
                FROM course_progress
                WHERE user_id = ${userId}
                AND class_id = ${classId}
                AND subject_id = ${subjectId}
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
                message:
                    "Progression de cours non trouvée pour cette classe et cette matière",
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
                    "Une progression de cours existe déjà pour cette classe et cette matière",
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

// Patch course progress
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
            updated_at: new DateTime(),
        };

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

// ------- LESSON PROGRESS ENDPOINTS -------

// Get lesson progress for a course progress
export const getLessonProgress = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<LessonProgress> => {
        const userId = getUserRecordId(context.user_id);
        const lessonProgressId = parseRecordId(input.id, "lesson_progress");

        // Verify ownership through course progress
        const query = surql`
            SELECT * FROM lesson_progress 
            WHERE id = ${lessonProgressId}
        `;
        const result = await context.db
            .query<[LessonProgressModel[]]>(query)
            .collect();
        const lessonProgress = result[0]?.[0];

        if (!lessonProgress) {
            throw new ORPCError("NOT_FOUND", {
                message: "Progression de leçon non trouvée",
            });
        }

        // Verify course progress ownership
        await verifyCourseProgressOwnership(
            context.db,
            lessonProgress.course_progress_id,
            userId
        );

        return LessonProgressMapper.fromModel(lessonProgress);
    });

// Create lesson progress
export const createLessonProgress = base
    .input(lesson_progress_create_input)
    .handler(async ({ input, context }): Promise<LessonProgress> => {
        const userId = getUserRecordId(context.user_id);
        const lessonId = parseRecordId(input.lesson_id, "lessons");
        const courseProgressId = parseRecordId(
            input.course_progress_id,
            "course_progress"
        );

        // Verify course progress ownership
        await verifyCourseProgressOwnership(
            context.db,
            courseProgressId,
            userId
        );

        // Verify lesson belongs to user
        const lessonQuery = surql`
            SELECT * FROM lessons 
            WHERE id = ${lessonId} AND user_id = ${userId}
        `;
        const lessonResult = await context.db
            .query<[LessonModel[]]>(lessonQuery)
            .collect();

        if (!lessonResult[0] || lessonResult[0].length === 0) {
            throw new ORPCError("NOT_FOUND", {
                message: "Leçon non trouvée",
            });
        }

        // Check if lesson progress already exists
        const checkQuery = surql`
            SELECT * FROM lesson_progress 
            WHERE lesson_id = ${lessonId} 
            AND course_progress_id = ${courseProgressId}
        `;
        const existing = await context.db
            .query<[LessonProgressModel[]]>(checkQuery)
            .collect();

        if (existing[0] && existing[0].length > 0) {
            throw new ORPCError("INVALID_REQUEST", {
                message:
                    "Une progression de leçon existe déjà pour cette leçon et ce cours",
            });
        }

        try {
            const lessonProgressTable = new Table("lesson_progress");
            const result = await context.db
                .create<LessonProgressModel>(lessonProgressTable)
                .content({
                    lesson_id: lessonId,
                    course_progress_id: courseProgressId,
                    status: input.status ?? "not_started",
                    scheduled_date: input.scheduled_date
                        ? new DateTime(input.scheduled_date)
                        : null,
                    comments:
                        input.comments?.map((comment) => ({
                            title: comment.title,
                            description: comment.description,
                            created_at: new DateTime(),
                            updated_at: new DateTime(),
                        })) ?? [],
                });

            return LessonProgressMapper.fromModel(result[0]);
        } catch (e) {
            console.error("error in createLessonProgress: ", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Erreur lors de la création de la progression de leçon",
            });
        }
    });

// Patch lesson progress
export const patchLessonProgress = base
    .input(lesson_progress_patch_input)
    .handler(async ({ input, context }): Promise<LessonProgress> => {
        const userId = getUserRecordId(context.user_id);
        const lessonProgressId = parseRecordId(input.id, "lesson_progress");

        // Get lesson progress and verify ownership
        const query = surql`
            SELECT * FROM lesson_progress 
            WHERE id = ${lessonProgressId}
        `;
        const result = await context.db
            .query<[LessonProgressModel[]]>(query)
            .collect();
        const lessonProgress = result[0]?.[0];

        if (!lessonProgress) {
            throw new ORPCError("NOT_FOUND", {
                message: "Progression de leçon non trouvée",
            });
        }

        await verifyCourseProgressOwnership(
            context.db,
            lessonProgress.course_progress_id,
            userId
        );

        const updateData: Partial<LessonProgressModel> = {
            ...(input.status !== undefined && { status: input.status }),
            ...(input.completed_at !== undefined && {
                completed_at: input.completed_at
                    ? new DateTime(input.completed_at)
                    : null,
            }),
            ...(input.scheduled_date !== undefined && {
                scheduled_date: input.scheduled_date
                    ? new DateTime(input.scheduled_date)
                    : null,
            }),
            ...(input.comments !== undefined && {
                comments: input.comments.map((comment) => ({
                    title: comment.title,
                    description: comment.description,
                    created_at: new DateTime(),
                    updated_at: new DateTime(),
                })),
            }),
            updated_at: new DateTime(),
        };

        // If status is being set to completed and completed_at is not set, set it
        if (
            input.status === "completed" &&
            !updateData.completed_at &&
            !lessonProgress.completed_at
        ) {
            updateData.completed_at = new DateTime();
        }

        try {
            const updated = await context.db
                .update<LessonProgressModel>(lessonProgressId)
                .merge(updateData);

            if (!updated) {
                throw new ORPCError("DATABASE_ERROR", {
                    message:
                        "Erreur lors de la mise à jour de la progression de leçon",
                });
            }

            return LessonProgressMapper.fromModel(updated);
        } catch (e) {
            if (e instanceof ORPCError) {
                throw e;
            }
            console.error("error in patchLessonProgress: ", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Erreur lors de la mise à jour de la progression de leçon",
            });
        }
    });

// Delete lesson progress
export const deleteLessonProgress = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<{ success: boolean }> => {
        const userId = getUserRecordId(context.user_id);
        const lessonProgressId = parseRecordId(input.id, "lesson_progress");

        // Get lesson progress and verify ownership
        const query = surql`
            SELECT * FROM lesson_progress 
            WHERE id = ${lessonProgressId}
        `;
        const result = await context.db
            .query<[LessonProgressModel[]]>(query)
            .collect();
        const lessonProgress = result[0]?.[0];

        if (!lessonProgress) {
            throw new ORPCError("NOT_FOUND", {
                message: "Progression de leçon non trouvée",
            });
        }

        await verifyCourseProgressOwnership(
            context.db,
            lessonProgress.course_progress_id,
            userId
        );

        try {
            await context.db.delete(lessonProgressId);
            return { success: true };
        } catch (e) {
            console.error("Error deleting lesson progress:", e);
            throw new ORPCError("DATABASE_ERROR", {
                message:
                    "Erreur lors de la suppression de la progression de leçon",
            });
        }
    });
