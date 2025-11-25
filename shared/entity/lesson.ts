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
    label: z.string().nullable(),
    start_at: z.string().nullable(),
    end_at: z.string().nullable(),
    comments: z.array(comments),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Lesson = z.infer<typeof lesson>;
