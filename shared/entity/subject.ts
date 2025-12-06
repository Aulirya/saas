import z from "zod";
import { lesson } from "./lesson";

export const subject = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    type: z.enum(["core", "option", "support"]).nullable().optional(),
    category: z.enum([
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
    ]),
});

export type Subject = z.infer<typeof subject>;

export const subject_with_lessons = subject.extend({
    lessons: z.array(lesson).optional(),
});

export type SubjectWithLessons = z.infer<typeof subject_with_lessons>;

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

export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];
