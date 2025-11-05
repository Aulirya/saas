import z from "zod";

export const school_class_create_input = z.object({
  name: z.string(),
  level: z.string(),
  school: z.string(),
  students_count: z.number(),
});

export type SchoolClassCreateInput = z.infer<typeof school_class_create_input>;

export const school_class_patch_input = z.object({
  id: z.string(),
  name: z.string().optional(),
  level: z.string().optional(),
  school: z.string().optional(),
  students_count: z.number().optional(),
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
