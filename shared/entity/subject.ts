import z from "zod";
import { lesson } from "./lesson";

export const SUBJECT_CATEGORIES = [
    "Mathematics",
    "Language",
    "Science",
    "Social",
    "Literature",
    "Sport",
    "History",
    "Geography",
    "Philosophy",
    "Civic",
    "Music",
    "Art",
    "Technology",
    "Computer Science",
    "Economics",
    "Other",
] as const;

export const SUBJECT_TYPES = ["core", "option", "support"] as const;

export const subject = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    category: z.enum(SUBJECT_CATEGORIES),
});

export const subject_with_lessons = subject.extend({
    lessons: z.array(lesson).optional(),
});

export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];

export type SubjectType = (typeof SUBJECT_TYPES)[number];

export type Subject = z.infer<typeof subject>;

export type SubjectWithLessons = z.infer<typeof subject_with_lessons>;
