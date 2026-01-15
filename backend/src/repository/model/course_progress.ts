import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const lessonProgressCommentModel = z.object({
    title: z.string().optional(),
    description: z.string(),
    created_at: z.custom<DateTime>(),
    updated_at: z.custom<DateTime>(),
});

const lessonProgressModel = z.object({
    id: z.custom<RecordId>(),
    lesson_id: z.custom<RecordId>(),
    course_progress_id: z.custom<RecordId>(),
    status: z.string(),
    completed_at: z.custom<DateTime>().nullable().optional(),
    scheduled_date: z.custom<DateTime>().nullable().optional(),
    comments: z.array(lessonProgressCommentModel).optional().default([]),
    created_at: z.custom<DateTime>(),
    updated_at: z.custom<DateTime>(),
});

const recurringScheduleSlotModel = z.object({
    day_of_week: z.number().int(),
    start_hour: z.number().int(),
    end_hour: z.number().int(),
    start_date: z.custom<DateTime>(),
});

const courseProgressModel = z.object({
    id: z.custom<RecordId>(),
    class_id: z.custom<RecordId>(),
    subject_id: z.custom<RecordId>(),
    user_id: z.custom<RecordId>(),
    status: z.string().default("not_started"),
    recurring_schedule: z
        .array(recurringScheduleSlotModel)
        .optional()
        .default([]),
    auto_scheduled: z.boolean().optional().default(false),
    created_at: z.custom<DateTime>(),
    updated_at: z.custom<DateTime>(),
});
export type CourseProgressModel = z.infer<typeof courseProgressModel>;
export type LessonProgressModel = z.infer<typeof lessonProgressModel>;
export type LessonProgressCommentModel = z.infer<
    typeof lessonProgressCommentModel
>;
export type RecurringScheduleSlotModel = z.infer<
    typeof recurringScheduleSlotModel
>;
