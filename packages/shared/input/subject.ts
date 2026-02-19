import z from "zod";
import { SUBJECT_CATEGORIES } from "../entity/subject";

export const subject_create_input = z.object({
    name: z.string().min(1, { message: "Le nom est requis" }),
    description: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    category: z.enum(SUBJECT_CATEGORIES).optional(),
});

export type SubjectCreateInput = z.infer<typeof subject_create_input>;

export const subject_patch_input = subject_create_input.partial().extend({
    id: z.string(),
});

export type SubjectPatchInput = z.infer<typeof subject_patch_input>;
