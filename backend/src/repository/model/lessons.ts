import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const commentSchema = z.object({
    title: z.string().optional(),
    description: z.string(),
    created_at: z.custom<DateTime>(),
    updated_at: z.custom<DateTime>(),
});

const lessonModel = z.object({
    created_at: z.custom<DateTime>().optional(),
    description: z.string(),
    end_at: z.custom<DateTime>().optional(),
    label: z.string(),
    start_at: z.custom<DateTime>().optional(),
    subject_id: z.custom<RecordId>(),
    updated_at: z.custom<DateTime>().optional(),
    user_id: z.custom<RecordId>(),
    id: z.custom<RecordId>(),
    comments: z.array(commentSchema).optional(),
});

export type LessonModel = z.infer<typeof lessonModel>;
export const LessonSchema = lessonModel;
