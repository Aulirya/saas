import z from "zod";
import { lesson } from "./lesson";

export const subject = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    total_hours: z.number(),
    hours_per_week: z.number(),
});

export type Subject = z.infer<typeof subject>;

export const subject_with_lessons = subject.extend({
    lessons: z.array(lesson).optional(),
});

export type SubjectWithLessons = z.infer<typeof subject_with_lessons>;
