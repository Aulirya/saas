import { useQuery, useQueries } from "@tanstack/react-query";
import { useCourseProgress } from "@/features/courses/api/useCourseProgress";
import { useSubjects } from "@/features/subjects/api/useSubjects";
import { useSchoolClasses } from "@/features/classes/api/useSchoolClasses";
import { orpc } from "@/orpc/client";
import { parseISO, getHours } from "date-fns";
import type { ScheduledCourse } from "../types";
import type { LessonProgress } from "@saas/shared";

/**
 * Format scheduled_date to a slot string
 */
function formatSlotFromDate(dateString: string | null | undefined): string {
    if (!dateString) return "8h-9h";
    try {
        const date = parseISO(dateString);
        const hour = getHours(date);
        const nextHour = hour + 1;
        return `${hour}h-${nextHour}h`;
    } catch {
        return "8h-9h";
    }
}

export function useCalendarEvents(params: {
    startISO: string;
    endISO: string;
}) {
    // Fetch all course progress
    const { data: allCourseProgress = [], isLoading: isLoadingProgress } =
        useCourseProgress();

    // Fetch subjects and classes for display
    const { data: allSubjects = [] } = useSubjects();
    const { data: allClasses = [] } = useSchoolClasses();

    // Fetch lesson progress for each course progress
    const lessonProgressQueries = useQueries({
        queries: allCourseProgress.map((cp) => ({
            queryKey: ["courseProgress", cp.id, "lessons"],
            queryFn: () =>
                orpc.courseProgress.getWithLessons.call({
                    id: cp.id,
                }),
            enabled: !!cp.id,
            staleTime: 60_000,
        })),
    });

    // Extract all lesson progress
    const allLessonProgress: LessonProgress[] = [];
    lessonProgressQueries.forEach((query) => {
        if (query.data?.lesson_progress) {
            allLessonProgress.push(...query.data.lesson_progress);
        }
    });

    const isLoading =
        isLoadingProgress || lessonProgressQueries.some((q) => q.isLoading);

    return useQuery({
        queryKey: ["calendarEvents", params, allLessonProgress.length],
        queryFn: (): ScheduledCourse[] => {
            // Filter lesson progress by date range
            const filtered = allLessonProgress.filter((lp) => {
                if (!lp.scheduled_date) return false;
                const scheduledDate = lp.scheduled_date.split("T")[0]; // Get date part
                return (
                    scheduledDate >= params.startISO &&
                    scheduledDate <= params.endISO
                );
            });

            // Transform to ScheduledCourse format
            const subjectsMap = new Map(allSubjects.map((s) => [s.id, s]));
            const classesMap = new Map(allClasses.map((c) => [c.id, c]));
            const courseProgressMap = new Map(
                allCourseProgress.map((cp) => [cp.id, cp])
            );

            return filtered
                .map((lp) => {
                    const cp = courseProgressMap.get(lp.course_progress_id);
                    if (!cp) return null;

                    const subject = subjectsMap.get(cp.subject_id);
                    const schoolClass = classesMap.get(cp.class_id);

                    if (!subject || !schoolClass) return null;

                    const scheduledDate =
                        lp.scheduled_date?.split("T")[0] || "";
                    const slot = formatSlotFromDate(lp.scheduled_date);

                    // Determine color based on subject category
                    const colorMap: Record<string, ScheduledCourse["color"]> = {
                        Mathematics: "blue",
                        Science: "green",
                        Language: "purple",
                    };
                    const color = colorMap[subject.category] || "blue";

                    return {
                        id: lp.id,
                        subject: subject.name,
                        level: schoolClass.level,
                        color,
                        date: scheduledDate,
                        slot,
                        lessonProgressId: lp.id,
                        courseProgressId: cp.id,
                        lessonId: lp.lesson_id,
                    } as ScheduledCourse & {
                        lessonProgressId: string;
                        courseProgressId: string;
                        lessonId: string;
                    };
                })
                .filter((c): c is ScheduledCourse => c !== null);
        },
        enabled: !isLoading && allCourseProgress.length > 0,
        staleTime: 60_000,
    });
}
