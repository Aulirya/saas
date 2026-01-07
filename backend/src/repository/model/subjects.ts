import { Subject } from "@saas/shared";
import type { DateTime, RecordId } from "surrealdb";
import z from "zod";
import { LessonSchema } from "./lessons";
import { SubjectMapper } from "../mapper/subject";

const subjectModel = z.object({
    id: z.custom<RecordId>(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string().nullable(),
    category: z.enum([
        "Mathematics",
        "Language",
        "Science",
        "Social",
        "Literature",
        "Sport",
        "History",
        "Geography",
        "Philosophy",
        "Civic",
        "Music",
        "Art",
        "Technology",
        "Computer Science",
        "Economics",
        "Other",
    ]),
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
