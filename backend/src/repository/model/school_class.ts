import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const schoolClassModel = z.object({
  id: z.custom<RecordId>(),
  name: z.string(),
  level: z.string(),
  user_id: z.custom<RecordId>(),
  school: z.string(),
  student_count: z.number(),
  updated_at: z.custom<DateTime>().optional(),
  created_at: z.custom<DateTime>().optional(),
});

export type SchoolClassModel = z.infer<typeof schoolClassModel>;
