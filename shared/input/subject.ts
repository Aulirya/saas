import z from "zod";
import { SUBJECT_CATEGORIES } from "../entity/subject";

export const subject_create_input = z.object({
    name: z.string().min(1, { message: "Le nom est requis" }),
    description: z.string().optional().nullable(),
    type: z.enum(["core", "option", "support"]).optional(),
    category: z.enum(SUBJECT_CATEGORIES, {
        message: "La catégorie est requise",
    }),
});

export type SubjectCreateInput = z.infer<typeof subject_create_input>;

export const subject_patch_input = z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional().nullable(),
    type: z.string().optional(),
    category: z
        .enum([
            "Mathematic",
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
        ])
        .optional(),
});

export type SubjectPatchInput = z.infer<typeof subject_patch_input>;
