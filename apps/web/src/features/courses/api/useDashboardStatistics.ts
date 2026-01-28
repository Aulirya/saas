import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAllLessonsForCalendar } from "./useCourseProgress";
import { orpc } from "@/orpc/client";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import type { Lesson } from "shared";

interface DashboardStatistics {
  lessonsThisWeek: number;
  plannedTimeMinutes: number;
  availableResources: number;
  aiSuggestions: number;
}

/**
 * Hook to get dashboard statistics
 */
export function useDashboardStatistics(options?: { weekStartDate?: Date }) {
  // Fetch all lesson progress in one call (calendar endpoint).
  const { data: allLessonsForCalendar = [], isLoading: isLoadingCalendar } =
    useAllLessonsForCalendar();

  // Fetch all lessons to get durations and count
  const { data: allLessons = [], isLoading: isLoadingLessons } = useQuery({
    ...orpc.lesson.list.queryOptions({}),
    staleTime: 60_000,
  });

  const isLoading = isLoadingCalendar || isLoadingLessons;

  const data = useMemo<DashboardStatistics>(() => {
    // Get current week boundaries
    const referenceDate = options?.weekStartDate ?? new Date();
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 }); // Sunday

    // Filter lesson progress for this week
    const lessonsThisWeek = allLessonsForCalendar.filter((lp) => {
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
  }, [allLessonsForCalendar, allLessons, options?.weekStartDate]);

  return { data, isLoading };
}
