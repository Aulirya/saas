import type { Lesson } from "@saas/shared";
import type { LessonModel } from "../model/lessons";

export namespace LessonMapper {
    export function fromModel(model: LessonModel): Lesson {
        return {
            id: model.id.toString(),
            description: model.description,
            end_at: model.end_at?.toISOString(),
            label: model.label,
            start_at: model.start_at?.toISOString(),
            subject_id: model.subject_id.toString(),
        };
    }
}
