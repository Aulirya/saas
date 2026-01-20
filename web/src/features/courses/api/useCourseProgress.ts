import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";
import type { RecurringScheduleSlot } from "@saas/shared";

/**
 * Hook to list all course progress for the current user
 * Can optionally filter by class_id and/or subject_id
 */
export function useCourseProgress(classId?: string, subjectId?: string) {
    return useQuery({
        ...orpc.courseProgress.list.queryOptions({
            input: {
                class_id: classId,
                subject_id: subjectId,
            },
        }),
        staleTime: 60_000,
    });
}

/**
 * Hook to get a single course progress by ID
 */
export function useCourseProgressById(id: string | undefined) {
    return useQuery({
        ...orpc.courseProgress.get.queryOptions({
            input: { id: id! },
        }),
        enabled: !!id,
        staleTime: 60_000,
    });
}

/**
 * Hook to get course progress with all lesson progress included
 */
export function useCourseProgressWithLessons(id: string | undefined) {
    return useQuery({
        ...orpc.courseProgress.getWithLessons.queryOptions({
            input: { id: id! },
        }),
        enabled: !!id,
        staleTime: 60_000,
    });
}

/**
 * Hook to delete course progress
 */
export function useDeleteCourseProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { id: string }) =>
            orpc.courseProgress.delete.call(input),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

export function useGenerateLessonProgressSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: {
            course_progress_id: string;
            options?: {
                handle_long_lessons?: "split" | "reduce_duration";
                regenerate_existing?: boolean;
            };
        }) => orpc.courseProgress.generateSchedule.call(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courseProgress"] });
            queryClient.invalidateQueries({ queryKey: ["lessonProgress"] });
            queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
        },
    });
}

/**
 * Hook to check for schedule conflicts
 * Uses debounced slots to avoid excessive API calls
 */
export function useCheckScheduleConflicts(
    courseProgressId: string,
    slots: RecurringScheduleSlot[],
    enabled: boolean = true
) {
    return useQuery({
        queryKey: ["courseProgress", courseProgressId, "checkConflicts", slots],
        queryFn: () =>
            orpc.courseProgress.checkScheduleConflictsOnly.call({
                course_progress_id: courseProgressId,
                recurring_schedule: slots,
            }),
        enabled:
            enabled &&
            !!courseProgressId &&
            slots.length > 0 &&
            slots.every((s) => s.end_hour > s.start_hour && s.day_of_week > 0),
        staleTime: 0, // Always check fresh conflicts
    });
}

/**
 * Hook to update the course progress schedule
 */
export function useUpdateCourseProgressSchedule(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: {
            id: string;
            recurring_schedule: RecurringScheduleSlot[];
        }) =>
            orpc.courseProgress.patch.call({
                id: input.id,
                recurring_schedule: input.recurring_schedule,
                auto_scheduled: false,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: orpc.courseProgress.get.queryOptions({
                    input: { id: id },
                }).queryKey,
            });
            queryClient.invalidateQueries({
                queryKey: orpc.courseProgress.getWithLessons.queryOptions({
                    input: { id: id },
                }).queryKey,
            });
            queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
        },
    });
}
