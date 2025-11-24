import z from "zod";

export const lesson = z.object({
    id: z.string(),
    subject_id: z.string(),
    description: z.string(),
    label: z.string().nullable(),
    start_at: z.string().nullable(),
    end_at: z.string().nullable(),
    comments: z.array(z.string()),
    created_at: z.string(),
    updated_at: z.string(),
});

export type Lesson = z.infer<typeof lesson>;
