import type {
    CourseProgressModel,
    LessonProgressModel,
    LessonProgressCommentModel,
} from "../model/course_progress";
import type {
    CourseProgress,
    LessonProgress,
    LessonProgressComment,
} from "@saas/shared";
import { CourseProgressStatus } from "@saas/shared";

export class CourseProgressMapper {
    static fromModel(model: CourseProgressModel): CourseProgress {
        return {
            id: model.id.toString(),
            class_id: model.class_id.toString(),
            subject_id: model.subject_id.toString(),
            user_id: model.user_id.toString(),
            status: model.status as CourseProgressStatus,
            recurring_schedule:
                model.recurring_schedule?.map((slot) => ({
                    day_of_week: slot.day_of_week,
                    start_hour: slot.start_hour,
                    end_hour: slot.end_hour,
                    start_date: slot.start_date.toISOString(),
                })) ?? [],
            auto_scheduled: model.auto_scheduled ?? false,
            created_at: model.created_at.toISOString(),
            updated_at: model.updated_at.toISOString(),
        };
    }
}

export namespace LessonProgressMapper {
    export function fromModel(model: LessonProgressModel): LessonProgress {
        return {
            id: model.id.toString(),
            lesson_id: model.lesson_id.toString(),
            course_progress_id: model.course_progress_id.toString(),
            status: model.status as LessonProgress["status"],
            completed_at: model.completed_at?.toISOString() ?? null,
            scheduled_date: model.scheduled_date?.toISOString() ?? null,
            comments: model.comments?.map(commentFromModel) ?? [],
            created_at: model.created_at.toISOString(),
            updated_at: model.updated_at.toISOString(),
        };
    }
}

function commentFromModel(
    model: LessonProgressCommentModel
): LessonProgressComment {
    return {
        title: model.title,
        description: model.description,
        created_at: model.created_at.toISOString(),
        updated_at: model.updated_at.toISOString(),
    };
}
