import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const subjectModel = z.object({
  id: z.custom<RecordId>(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  total_hours: z.number(),
  hours_per_week: z.number(),
  user_id: z.custom<RecordId>(),
  created_at: z.custom<DateTime>(),
  updated_at: z.custom<DateTime>(),
});

export type SubjectModel = z.infer<typeof subjectModel>;
