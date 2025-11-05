import type { Lesson } from "@saas/shared";
import type { LessonModel } from "../model/lessons";

export namespace LessonMapper {
  export function fromModel(model: LessonModel): Lesson {
    return {
      id: model.id.toString(),
      title: model.title,
      date: model.date,
      duration_minutes: model.duration_minutes,
      average_duration: model.average_duration,
      status: model.status,
      class_id: model.class_id.toString(),
      subject_id: model.subject_id.toString(),
    };
  }
}
