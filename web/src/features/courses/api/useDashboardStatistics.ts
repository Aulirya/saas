import { useQuery, useQueries } from "@tanstack/react-query";
import { useCourseProgress } from "./useCourseProgress";
import { orpc } from "@/orpc/client";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import type { LessonProgress, Lesson } from "@saas/shared";

interface DashboardStatistics {
    lessonsThisWeek: number;
    plannedTimeMinutes: number;
    availableResources: number;
    aiSuggestions: number;
}

/**
 * Hook to get dashboard statistics
 */
export function useDashboardStatistics() {
    // Fetch all course progress
    const { data: allCourseProgress = [], isLoading: isLoadingProgress } =
        useCourseProgress();

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

    // Fetch all lessons to get durations and count
    const { data: allLessons = [] } = useQuery({
        ...orpc.lesson.list.queryOptions({}),
        staleTime: 60_000,
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
        queryKey: [
            "dashboardStatistics",
            allCourseProgress.length,
            allLessonProgress.length,
            allLessons.length,
        ],
        queryFn: (): DashboardStatistics => {
            // Get current week boundaries
            const now = new Date();
            const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

            // Filter lesson progress for this week
            const lessonsThisWeek = allLessonProgress.filter((lp) => {
                if (!lp.scheduled_date) return false;
                try {
                    const scheduledDate = parseISO(lp.scheduled_date);
                    return isWithinInterval(scheduledDate, {
                        start: weekStart,
                        end: weekEnd,
                    });
                } catch {
                    return false;
                }
            });

            // Create a map of lesson_id to lesson for quick lookup
            const lessonsMap = new Map<string, Lesson>();
            allLessons.forEach((lesson) => {
                lessonsMap.set(lesson.id, lesson);
            });

            // Calculate planned time (sum of durations for lessons scheduled this week)
            const plannedTimeMinutes = lessonsThisWeek.reduce((total, lp) => {
                const lesson = lessonsMap.get(lp.lesson_id);
                return total + (lesson?.duration ?? 60); // Default to 60 minutes if not found
            }, 0);

            // Count available resources (all lessons)
            const availableResources = 0;

            // AI suggestions (placeholder - could be implemented later)
            const aiSuggestions = 0;

            return {
                lessonsThisWeek: lessonsThisWeek.length,
                plannedTimeMinutes,
                availableResources,
                aiSuggestions,
            };
        },
        enabled: !isLoading,
        staleTime: 60_000,
    });
}
