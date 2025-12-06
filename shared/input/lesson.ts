import z from "zod";

export const lesson_create_input = z.object({
  subject_id: z.string(),
    description: z.string().optional().default(""),
    label: z.string().min(1, "Le titre est requis"),
    order: z.number().int().positive().optional(),
    duration: z.number().int().positive().default(60),
    status: z
        .enum(["done", "to_review", "in_progress", "to_do"])
        .default("to_do"),
    scope: z.enum(["core", "bonus", "optional"]).default("core"),
  comments: z.array(z.custom<CommentInput>()).optional(),
});

export type LessonCreateInput = z.infer<typeof lesson_create_input>;

export const lesson_patch_input = z.object({
  id: z.string(),
  subject_id: z.string().optional(),
    label: z.string().min(1, "Le titre est requis").optional(),
    order: z.number().int().positive().optional(),
    duration: z.number().int().positive().optional(),
  description: z.string().optional(),
    status: z.enum(["done", "to_review", "in_progress", "to_do"]).optional(),
    scope: z.enum(["core", "bonus", "optional"]).optional(),
  comments: z.array(z.custom<CommentInput>()).optional(),
});

export type LessonPatchInput = z.infer<typeof lesson_patch_input>;

const comment_input = z.object({
  title: z.string(),
  description: z.string(),
});

export type CommentInput = z.infer<typeof comment_input>;
