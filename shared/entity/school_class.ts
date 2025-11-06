import z from "zod";

export const school_class = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string(),
  school: z.string(),
  students_count: z.number(),
});

export type SchoolClass = z.infer<typeof school_class>;
