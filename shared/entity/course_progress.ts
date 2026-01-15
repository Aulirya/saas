import z from "zod";

// Status for course progress tracking
export const COURSE_PROGRESS_STATUSES = [
    "not_started",
    "in_progress",
    "completed",
    "on_hold",
] as const;

export type CourseProgressStatus = (typeof COURSE_PROGRESS_STATUSES)[number];

// Lesson progress status per course
export const LESSON_PROGRESS_STATUSES = [
    "not_started",
    "scheduled",
    "in_progress",
    "completed",
    "skipped",
] as const;

export type LessonProgressStatus = (typeof LESSON_PROGRESS_STATUSES)[number];

// Comment structure for lesson progress
export const lesson_progress_comment = z.object({
    title: z.string().optional(),
    description: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export type LessonProgressComment = z.infer<typeof lesson_progress_comment>;

// Lesson progress entity
export const lesson_progress = z.object({
    id: z.string(),
    lesson_id: z.string(),
    course_progress_id: z.string(),
    status: z.enum(LESSON_PROGRESS_STATUSES),
    completed_at: z.string().nullable().optional(),
    scheduled_date: z.string().nullable().optional(),
    comments: z.array(lesson_progress_comment).optional().default([]),
    created_at: z.string(),
    updated_at: z.string(),
});

export type LessonProgress = z.infer<typeof lesson_progress>;

// Recurring schedule slot
export const recurring_schedule_slot = z.object({
    day_of_week: z.number().int().min(1).max(7), // 1 = Monday, 7 = Sunday
    start_hour: z.number().int().min(0).max(23),
    end_hour: z.number().int().min(0).max(23),
    start_date: z.string(), // ISO datetime string
});

export type RecurringScheduleSlot = z.infer<typeof recurring_schedule_slot>;

// Course progress entity
export const course_progress = z.object({
    id: z.string(),
    class_id: z.string(),
    subject_id: z.string(),
    user_id: z.string(),
    status: z.enum(COURSE_PROGRESS_STATUSES).default("not_started"),
    recurring_schedule: z.array(recurring_schedule_slot).optional().default([]),
    auto_scheduled: z.boolean().optional().default(false),
    created_at: z.string(),
    updated_at: z.string(),
});

export type CourseProgress = z.infer<typeof course_progress>;

// Course progress with lesson progress
export const course_progress_with_lessons = course_progress.extend({
    lesson_progress: z.array(lesson_progress).optional().default([]),
});

export type CourseProgressWithLessons = z.infer<
    typeof course_progress_with_lessons
>;
