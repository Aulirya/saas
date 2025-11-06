import type { Subject } from "@saas/shared";
import type { SubjectModel } from "../model/subjects";

export namespace SubjectMapper {
  export function fromModel(model: SubjectModel): Subject {
    return {
      id: model.id.toString(),
      name: model.name,
      description: model.description,
      type: model.type,
      total_hours: model.total_hours,
      hours_per_week: model.hours_per_week,
    };
  }
}
