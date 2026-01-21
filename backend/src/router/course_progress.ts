import { base } from "./base";
import z from "zod";
import { parseRecordId } from "../utils/record-id";
import {
    course_progress_create_input,
    course_progress_patch_input,
    CourseProgressWithRelations,
    type CourseProgress,
    type CourseProgressWithLessons,
} from "@saas/shared";
import { getUserRecordId } from "../utils/course_progress";
import {
    createCourseProgress as createCourseProgressService,
    deleteCourseProgress as deleteCourseProgressService,
    getCourseProgress as getCourseProgressService,
    getCourseProgressWithLessons as getCourseProgressWithLessonsService,
    patchCourseProgress as patchCourseProgressService,
    getAllLessonsForCalendar as getAllLessonsForCalendarService,
    listCourseProgress as listCourseProgressService,
} from "../services/courseProgress.service";
import { checkScheduleConflictsForInput } from "../services/scheduleConflicts.service";
import { generateLessonProgressSchedule as generateLessonProgressScheduleService } from "../services/lessonSchedule.service";

export const listCourseProgress = base
    .input(
        z.object({
            class_id: z.string().optional(),
            subject_id: z.string().optional(),
        })
    )
    .handler(async ({ input, context }): Promise<CourseProgress[]> => {
        const userId = getUserRecordId(context.user_id);
        const classId = input.class_id
            ? parseRecordId(input.class_id, "classes")
            : undefined;
        const subjectId = input.subject_id
            ? parseRecordId(input.subject_id, "subjects")
            : undefined;

        return listCourseProgressService({
            db: context.db,
            userId,
            classId,
            subjectId,
        });
    });

export const getCourseProgress = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<CourseProgress> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        return getCourseProgressService({
            db: context.db,
            userId,
            courseProgressId,
        });
    });

export const getCourseProgressWithLessons = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<CourseProgressWithLessons> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        return getCourseProgressWithLessonsService({
            db: context.db,
            userId,
            courseProgressId,
        });
    });

export const getAllLessonsForCalendar = base.handler(
    async ({ context }): Promise<CourseProgressWithRelations[]> => {
        const userId = getUserRecordId(context.user_id);
        return await getAllLessonsForCalendarService({
            db: context.db,
            userId,
        });
    }
);

export const createCourseProgress = base
    .input(course_progress_create_input)
    .handler(async ({ input, context }): Promise<CourseProgress> => {
        const userId = getUserRecordId(context.user_id);
        const classId = parseRecordId(input.class_id, "classes");
        const subjectId = parseRecordId(input.subject_id, "subjects");

        return createCourseProgressService({
            db: context.db,
            userId,
            classId,
            subjectId,
            status: input.status,
        });
    });

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

        const conflicts = await checkScheduleConflictsForInput({
            db: context.db,
            userId,
            courseProgressId,
            recurringSchedule: input.recurring_schedule,
        });

        return { conflicts };
    });

export const patchCourseProgress = base
    .input(course_progress_patch_input)
    .handler(async ({ input, context }): Promise<CourseProgress> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        return patchCourseProgressService({
            db: context.db,
            userId,
            courseProgressId,
            input,
        });
    });

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

            return generateLessonProgressScheduleService({
                db: context.db,
                userId,
                courseProgressId,
                options: input.options,
            });
        }
    );

export const deleteCourseProgress = base
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }): Promise<{ success: boolean }> => {
        const userId = getUserRecordId(context.user_id);
        const courseProgressId = parseRecordId(input.id, "course_progress");

        return deleteCourseProgressService({
            db: context.db,
            userId,
            courseProgressId,
        });
    });
