import z from "zod";

export const lesson_create_input = z.object({
  class_id: z.string(),
  subject_id: z.string(),
  description: z.string(),
  label: z.string().nullable(),
  start_at: z.iso.datetime().nullable(),
  end_at: z.iso.datetime().nullable(),
  comments: z.array(z.custom<CommentInput>()).optional(),
});

export type LessonCreateInput = z.infer<typeof lesson_create_input>;

export const lesson_patch_input = z.object({
  id: z.string(),
  subject_id: z.string().optional(),
  class_id: z.string().optional(),
  label: z.string().optional(),
  start_at: z.iso.datetime().optional(),
  end_at: z.iso.datetime().optional(),
  description: z.string().optional(),
  comments: z.array(z.custom<CommentInput>()).optional(),
});

export type LessonPatchInput = z.infer<typeof lesson_patch_input>;

const comment_input = z.object({
  title: z.string(),
  description: z.string(),
});

export type CommentInput = z.infer<typeof comment_input>;
