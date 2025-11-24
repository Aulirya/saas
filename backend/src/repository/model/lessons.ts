import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const lessonModel = z.object({
  id: z.custom<RecordId>(),
  class_id: z.custom<RecordId>(),
  subject_id: z.custom<RecordId>(),
  description: z.string(),
  label: z.string().nullable(),
  start_at: z.custom<DateTime>().nullable(),
  end_at: z.custom<DateTime>().nullable(),
  comments: z.array(z.custom<CommentModel>()),
  created_at: z.custom<DateTime>(),
  updated_at: z.custom<DateTime>(),
});

export type LessonModel = z.infer<typeof lessonModel>;

const commentModel = z.object({
  title: z.string(),
  description: z.string(),
  created_at: z.custom<DateTime>(),
  updated_at: z.custom<DateTime>(),
});
export type CommentModel = z.infer<typeof commentModel>;
