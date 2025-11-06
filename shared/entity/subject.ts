import z from "zod";

export const subject = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  total_hours: z.number(),
  hours_per_week: z.number(),
});

export type Subject = z.infer<typeof subject>;
