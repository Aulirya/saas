import type { Lesson } from "@saas/shared";
import type { LessonModel } from "../model/lessons";

export namespace LessonMapper {
    export function fromModel(model: LessonModel): Lesson {
        return {
            id: model.id.toString(),
            subject_id: model.subject_id.toString(),
            description: model.description,
            label: model.label,
            order: model.order,
            duration: model.duration ?? 60,
            status: (model.status as Lesson["status"]) ?? "to_do",
            scope: (model.scope as Lesson["scope"]) ?? "core",
            comments:
                model.comments?.map((comment) => ({
                    title: comment.title ?? "",
                    description: comment.description,
                    created_at: comment.created_at?.toString() ?? "",
                    updated_at: comment.updated_at?.toString() ?? "",
                })) ?? [],
            created_at: model.created_at?.toString() ?? "",
            updated_at: model.updated_at?.toString() ?? "",
        };
    }
}
