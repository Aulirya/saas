import type { CourseProgressWithLessons } from "@saas/shared";
import type { Subject } from "@saas/shared";
import type { SchoolClass } from "@saas/shared";
import type { CourseProgram, CourseChapter } from "../types";
import type { Lesson } from "@saas/shared";

/**
 * Map course progress status to CourseProgram status
 */
function mapStatus(
    status: CourseProgressWithLessons["status"]
): CourseProgram["status"] {
    switch (status) {
        case "completed":
            return "defined";
        case "in_progress":
            return "partial";
        case "not_started":
        case "on_hold":
        default:
            return "draft";
    }
}

/**
 * Get status label from status
 */
function getStatusLabel(status: CourseProgram["status"]): string {
    switch (status) {
        case "defined":
            return "Programme défini";
        case "partial":
            return "Programme partiel";
        case "draft":
        default:
            return "Programme à définir";
    }
}

/**
 * Transform CourseProgressWithLessons to CourseProgram format
 *
 * This function:
 * - Combines course progress with subject and class data
 * - Calculates total and completed hours from lessons
 * - Extracts next lessons (scheduled or not started, or from lesson order)
 * - Maps status and creates CourseProgram object
 */
export function transformCourseProgressToProgram(
    courseProgress: CourseProgressWithLessons,
    subject: Subject,
    schoolClass: SchoolClass,
    allLessons: Lesson[] = []
): CourseProgram {
    // Get all lessons for this subject, sorted by order if available
    const subjectLessons = allLessons
        .filter((lesson) => lesson.subject_id === subject.id)
        .sort((a, b) => {
            // Sort by order if available, otherwise by creation date
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return 0;
        });

    // Calculate total hours from all lessons of the subject
    const totalHours = subjectLessons.reduce(
        (sum, lesson) => sum + (lesson.duration || 60) / 60,
        0
    );

    // Calculate completed hours from lesson progress with status 'completed'
    // If no lesson_progress, use course progress status as fallback
    let completedHours = 0;
    if (
        courseProgress.lesson_progress &&
        courseProgress.lesson_progress.length > 0
    ) {
        completedHours = courseProgress.lesson_progress
            .filter((lp) => lp.status === "completed")
            .reduce((sum, lp) => {
                // Find the lesson to get its duration
                const lesson = subjectLessons.find(
                    (l) => l.id === lp.lesson_id
                );
                const duration = lesson?.duration || 60;
                return sum + duration / 60;
            }, 0);
    } else if (courseProgress.status === "completed") {
        // If course is completed, all hours are completed
        completedHours = totalHours;
    } else if (courseProgress.status === "in_progress") {
        // Estimate: if in progress, assume 30% completed
        completedHours = totalHours * 0.3;
    }

    // Extract next lessons from lesson_progress if available, otherwise from lessons list
    let nextLessons: CourseChapter[] = [];
    let completedLessons: CourseChapter[] = [];

    if (
        courseProgress.lesson_progress &&
        courseProgress.lesson_progress.length > 0
    ) {
        // Use lesson_progress data for next lessons
        nextLessons = courseProgress.lesson_progress
            .filter(
                (lp) => lp.status === "scheduled" || lp.status === "not_started"
            )
            .map((lp) => {
                const lesson = subjectLessons.find(
                    (l) => l.id === lp.lesson_id
                );
                if (!lesson) return null;

                const plannedHours = (lesson.duration || 60) / 60;
                const date = lp.scheduled_date
                    ? new Date(lp.scheduled_date)
                    : undefined;

                return {
                    id: lp.id,
                    title:
                        lesson.label ||
                        lesson.description ||
                        "Leçon sans titre",
                    plannedHours,
                    date: date || new Date(),
                };
            })
            .filter((lesson): lesson is CourseChapter => lesson !== null)
            .sort((a, b) => {
                if (a.date && b.date) {
                    return a.date.getTime() - b.date.getTime();
                }
                return 0;
            })
            .slice(0, 5);

        // Extract completed lessons from lesson_progress
        completedLessons = courseProgress.lesson_progress
            .filter((lp) => lp.status === "completed")
            .map((lp) => {
                const lesson = subjectLessons.find(
                    (l) => l.id === lp.lesson_id
                );
                if (!lesson) return null;

                const plannedHours = (lesson.duration || 60) / 60;
                // Use completed_at if available, otherwise scheduled_date, otherwise current date
                const date = lp.completed_at
                    ? new Date(lp.completed_at)
                    : lp.scheduled_date
                    ? new Date(lp.scheduled_date)
                    : new Date();

                return {
                    id: lp.id,
                    title:
                        lesson.label ||
                        lesson.description ||
                        "Leçon sans titre",
                    plannedHours,
                    date,
                };
            })
            .filter((lesson): lesson is CourseChapter => lesson !== null)
            .sort((a, b) => {
                // Sort by date descending (most recent first)
                if (a.date && b.date) {
                    return b.date.getTime() - a.date.getTime();
                }
                return 0;
            });
    } else {
        // Fallback: use lessons that are not completed
        nextLessons = subjectLessons
            .filter((lesson) => lesson.status !== "done")
            .slice(0, 5)
            .map((lesson) => ({
                id: lesson.id,
                title: lesson.label || lesson.description || "Leçon sans titre",
                plannedHours: (lesson.duration || 60) / 60,
                date: new Date(), // No specific date available
            }));

        // Fallback: use lessons that are done
        completedLessons = subjectLessons
            .filter((lesson) => lesson.status === "done")
            .map((lesson) => ({
                id: lesson.id,
                title: lesson.label || lesson.description || "Leçon sans titre",
                plannedHours: (lesson.duration || 60) / 60,
                date: new Date(), // No specific date available
            }));
    }

    // Calculate stats
    const stats = {
        uploads: 0, // TODO: Calculate from files/attachments if available
        evaluations: 0, // TODO: Calculate from evaluations if available
        averageLessonMinutes:
            subjectLessons.length > 0
                ? Math.round(
                      subjectLessons.reduce(
                          (sum, lesson) => sum + (lesson.duration || 60),
                          0
                      ) / subjectLessons.length
                  )
                : 0,
    };

    // Calculate weekly hours from recurring schedule
    const calculateWeeklyHours = (
        schedule: typeof courseProgress.recurring_schedule
    ): number => {
        if (!schedule || schedule.length === 0) {
            return 0;
        }

        // Sum up all the hours from all schedule slots
        return schedule.reduce((totalHours, slot) => {
            const duration = slot.end_hour - slot.start_hour;
            return totalHours + duration;
        }, 0);
    };

    const weeklyHours = calculateWeeklyHours(courseProgress.recurring_schedule);

    // Map status
    const status = mapStatus(courseProgress.status);
    const statusLabel = getStatusLabel(status);

    return {
        id: courseProgress.id,
        subject: subject.name,
        subjectCategory: subject.category,
        level: schoolClass.level,
        className: schoolClass.name,
        weeklyHours: Math.round(weeklyHours * 10) / 10, // Round to 1 decimal
        students: schoolClass.students_count,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        completedHours: Math.round(completedHours * 10) / 10,
        status,
        statusLabel,
        nextLessons,
        completedLessons,
        stats,
    };
}
