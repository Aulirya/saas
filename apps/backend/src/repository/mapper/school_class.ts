import type { SchoolClass } from "shared";
import type { SchoolClassModel } from "../model/school_class";

export namespace SchoolClassMapper {
  export function fromModel(model: SchoolClassModel): SchoolClass {
    return {
      id: model.id.toString(),
      name: model.name,
      level: model.level,
      school: model.school,
      students_count: model.students_count,
      updated_at: model.updated_at?.toString(),
      created_at: model.created_at?.toString(),
    };
  }
}
