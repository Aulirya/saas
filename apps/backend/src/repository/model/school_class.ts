import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const schoolClassModel = z.object({
    id: z.custom<RecordId>(),
    name: z.string().min(1, "Name is required"),
    level: z.string().min(1, "Level is required"),
    user_id: z.custom<RecordId>(),
    school: z.string().min(1, "School is required"),
    students_count: z.number(),
    updated_at: z.custom<DateTime>().optional(),
    created_at: z.custom<DateTime>().optional(),
});

export type SchoolClassModel = z.infer<typeof schoolClassModel>;
