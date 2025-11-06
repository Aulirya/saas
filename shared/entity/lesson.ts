import z from "zod";

export const lesson = z.object({
  id: z.string(),
  title: z.string(),
  date: z.custom<Date>(),
  duration_minutes: z.number(),
  average_duration: z.number(),
  status: z.enum(["backlog", "planned", "in progress", "done", "late"]),
  class_id: z.string(),
  subject_id: z.string(),
});

export type Lesson = z.infer<typeof lesson>;
