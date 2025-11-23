import z from "zod";

export const lesson = z.object({
    id: z.string(),
    description: z.string(),
    end_at: z.string().optional(),
    label: z.string(),
    start_at: z.string().optional(),
    subject_id: z.string(),
});

export type Lesson = z.infer<typeof lesson>;
