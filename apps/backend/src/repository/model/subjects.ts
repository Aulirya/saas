import { Subject } from "shared";
import type { DateTime, RecordId } from "surrealdb";
import z from "zod";
import { LessonSchema } from "./lessons";
import { SubjectMapper } from "../mapper/subject";
import { SUBJECT_CATEGORIES } from "shared";

const subjectModel = z.object({
  id: z.custom<RecordId>(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string().nullable(),
  category: z.enum(SUBJECT_CATEGORIES),
  user_id: z.custom<RecordId>(),
  created_at: z.custom<DateTime>().optional(),
  updated_at: z.custom<DateTime>().optional(),
  lessons: z.array(LessonSchema).optional(),
});

export type SubjectModel = z.infer<typeof subjectModel>;

export namespace SubjectModelMapper {
  export function fromModel(model: SubjectModel): Subject {
    return SubjectMapper.fromModel(model);
  }
}
