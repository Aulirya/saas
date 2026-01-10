import z from "zod";

export const school_class_create_input = z.object({
    name: z
        .string()
        .min(2, "Le nom de la classe doit contenir au moins 2 caractères"),
    level: z.string().min(1, "Le niveau est requis"),
    school: z.string().min(1, "Le nom de l'établissement est requis"),
    students_count: z
        .number()
        .min(1, "Le nombre d'élèves doit être supérieur à 0")
        .int("Le nombre d'élèves doit être un nombre entier"),
    subjects: z.array(z.string()).optional(),
});

export type SchoolClassCreateInput = z.infer<typeof school_class_create_input>;

export const school_class_patch_input = z.object({
    id: z.string(),
    name: z.string().optional(),
    level: z.string().optional(),
    school: z.string().optional(),
    students_count: z.number().optional(),
    subjects: z.array(z.string()).optional(),
});

export type SchoolClassPatchInput = z.infer<typeof school_class_patch_input>;

export const school_class_update_input = z.object({
    id: z.string(),
    name: z.string(),
    level: z.string(),
    school: z.string(),
    students_count: z.number(),
});

export type SchoolClassUpdateInput = z.infer<typeof school_class_update_input>;
