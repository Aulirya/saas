import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const usersModel = z.object({
  id: z.custom<RecordId>(),
  email: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(["teacher", "student"]),
  schools: z.array(z.string()),
  created_at: z.custom<DateTime>().optional(),
  updated_at: z.custom<DateTime>().optional(),
});

export type Users = z.infer<typeof usersModel>;
