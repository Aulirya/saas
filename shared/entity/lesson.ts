import z from "zod";

export const comments = z.object({
    title: z.string(),
    description: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const lesson = z.object({
    id: z.string(),
    subject_id: z.string(),
    description: z.string(),
    label: z.string(),
    order: z.number().optional(),
    duration: z.number().default(60),
    status: z.enum(["done", "to_review", "in_progress", "to_do"]),
    scope: z.enum(["core", "bonus", "optional"]),
    comments: z.array(comments),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Lesson = z.infer<typeof lesson>;
