import { DateTime, surql, Table } from "surrealdb";
import { base } from "./base";
import type { LessonProgressModel } from "../repository/model/course_progress";
import { LessonProgressMapper } from "../repository/mapper/course_progress";
import z from "zod";
import { parseRecordId } from "../utils/record-id";
import {
    lesson_progress_create_input,
    lesson_progress_patch_input,
    type LessonProgress,
} from "@saas/shared";
import { ORPCError } from "@orpc/server";
import type { LessonModel } from "../repository/model/lessons";
import {
    getUserRecordId,
    verifyCourseProgressOwnership,
} from "../utils/course_progress";

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
