import type { CourseProgressModel } from "../model/course_progress";

export namespace CourseProgressMapper {
    export function fromModel(model: CourseProgressModel): {
        class_id: string;
        subject_id: string;
    } {
        return {
            class_id: model.class_id.toString(),
            subject_id: model.subject_id.toString(),
        };
    }
}
