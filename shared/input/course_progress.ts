import z from "zod";
import {
    COURSE_PROGRESS_STATUSES,
    LESSON_PROGRESS_STATUSES,
} from "../entity/course_progress";

// Comment input for lesson progress
const lesson_progress_comment_input = z.object({
    title: z.string().optional(),
    description: z.string().min(1, "Le commentaire est requis"),
});

export type LessonProgressCommentInput = z.infer<
    typeof lesson_progress_comment_input
>;

// Course progress create input
export const course_progress_create_input = z.object({
    class_id: z.string().min(1, "L'ID de la classe est requis"),
    subject_id: z.string().min(1, "L'ID de la matière est requis"),
    status: z.enum(COURSE_PROGRESS_STATUSES).optional().default("not_started"),
});

export type CourseProgressCreateInput = z.infer<
    typeof course_progress_create_input
>;

// Course progress patch input
export const course_progress_patch_input = z.object({
    id: z.string(),
    status: z.enum(COURSE_PROGRESS_STATUSES).optional(),
});

export type CourseProgressPatchInput = z.infer<
    typeof course_progress_patch_input
>;

// Lesson progress create input
export const lesson_progress_create_input = z.object({
    lesson_id: z.string().min(1, "L'ID de la leçon est requis"),
    course_progress_id: z
        .string()
        .min(1, "L'ID de la progression du cours est requis"),
    status: z.enum(LESSON_PROGRESS_STATUSES).optional().default("not_started"),
    scheduled_date: z.string().nullable().optional(),
    comments: z.array(lesson_progress_comment_input).optional().default([]),
});

export type LessonProgressCreateInput = z.infer<
    typeof lesson_progress_create_input
>;

// Lesson progress patch input
export const lesson_progress_patch_input = z.object({
    id: z.string(),
    status: z.enum(LESSON_PROGRESS_STATUSES).optional(),
    completed_at: z.string().nullable().optional(),
    scheduled_date: z.string().nullable().optional(),
    comments: z.array(lesson_progress_comment_input).optional(),
});

export type LessonProgressPatchInput = z.infer<
    typeof lesson_progress_patch_input
>;
