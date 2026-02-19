import z from "zod";
import { subject_with_lessons } from "./subject";
import { lesson } from "./lesson";

export const school_class = z.object({
    id: z.string(),
    name: z.string(),
    level: z.string(),
    school: z.string(),
    students_count: z.number(),
    updated_at: z.string().optional(),
    created_at: z.string().optional(),
});

export const school_class_with_subjects_and_lessons = z.object({
    ...school_class.shape,
    subjects_count: z.number(),
    weekly_hours: z.number(),
    subjects: {
        ...subject_with_lessons.shape,
        lessons: z.array(lesson),
    },
});

export type SchoolClass = z.infer<typeof school_class>;

export type SchoolClassWithSubjectsAndLessons = z.infer<
    typeof school_class_with_subjects_and_lessons
>;
