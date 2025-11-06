import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const lessonModel = z.object({
  id: z.custom<RecordId>(),
  title: z.string(),
  date: z.custom<DateTime>().nullable(), // This should be removed
  duration_minutes: z.number(),
  average_duration: z.number(),
  status: z.enum(["backlog", "planned", "in progress", "done", "late"]),
  class_id: z.custom<RecordId>(),
  subject_id: z.custom<RecordId>(),
  user_id: z.custom<RecordId>(),
});

export type LessonModel = z.infer<typeof lessonModel>;
