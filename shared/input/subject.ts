import z from "zod";

export const subject_create_input = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
  type: z.string(),
  total_hours: z.number(),
  hours_per_week: z.number(),
  user_id: z.string(),
});

export type SubjectCreateInput = z.infer<typeof subject_create_input>;

export const subject_patch_input = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  type: z.string().optional(),
  total_hours: z.number().optional(),
  hours_per_week: z.number().optional(),
});

export type SubjectPatchInput = z.infer<typeof subject_patch_input>;
