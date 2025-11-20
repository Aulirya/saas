import type { Lesson } from "@saas/shared";
import type { LessonModel } from "../model/lessons";

export namespace LessonMapper {
  export function fromModel(model: LessonModel): Lesson {
    return {
      id: model.id.toString(),
      class_id: model.class_id.toString(),
      subject_id: model.subject_id.toString(),
      description: model.description,
      label: model.label,
      start_at: model.start_at ? model.start_at.toString() : null,
      end_at: model.end_at ? model.end_at.toString() : null,
      comments: model.comments.map((comment) => comment.title),
      created_at: model.created_at.toString(),
      updated_at: model.updated_at.toString(),
    };
  }
}
