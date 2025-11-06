import z from "zod";

export const lesson_create_input = z.object({
  title: z.string(),
  duration_minutes: z.number(),
  average_duration: z.number(),
  status: z.enum(["backlog", "planned", "in progress", "done", "late"]),
  class_id: z.string(),
  subject_id: z.string(),
  user_id: z.string(),
});

export type LessonCreateInput = z.infer<typeof lesson_create_input>;

export const lesson_patch_input = z.object({
  id: z.string(),
  title: z.string().optional(),
  duration_minutes: z.number().optional(),
  average_duration: z.number().optional(),
  status: z
    .enum(["backlog", "planned", "in progress", "done", "late"])
    .optional(),
  class_id: z.string().optional(),
  subject_id: z.string().optional(),
});

export type LessonPatchInput = z.infer<typeof lesson_patch_input>;
