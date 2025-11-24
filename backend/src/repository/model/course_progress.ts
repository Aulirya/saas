import type { DateTime, RecordId } from "surrealdb";
import z from "zod";

const courseProgressModel = z.object({
    class_id: z.custom<RecordId>(),
    subject_id: z.custom<RecordId>(),
});

export type CourseProgressModel = z.infer<typeof courseProgressModel>;
