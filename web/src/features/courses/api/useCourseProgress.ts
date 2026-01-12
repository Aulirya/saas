import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

/**
 * Hook to list all course progress for the current user
 * Can optionally filter by class_id and/or subject_id
 */
export function useCourseProgress(filters?: {
    class_id?: string;
    subject_id?: string;
}) {
    return useQuery({
        ...orpc.courseProgress.list.queryOptions({
            input: filters,
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
 * Hook to get course progress by class and subject combination
 * This is the main endpoint used in the courses page
 */
export function useCourseProgressByClassAndSubject(
    classId: string | undefined,
    subjectId: string | undefined
) {
    return useQuery({
        ...orpc.courseProgress.getByClassAndSubject.queryOptions({
            input: {
                class_id: classId!,
                subject_id: subjectId!,
            },
        }),
        enabled: !!classId && !!subjectId,
        staleTime: 60_000,
    });
}

/**
 * Hook to create a new course progress
 */
export function useCreateCourseProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: {
            class_id: string;
            subject_id: string;
            status?: string;
        }) => orpc.courseProgress.create.call({ input }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

/**
 * Hook to update course progress
 */
export function useUpdateCourseProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { id: string; status?: string }) =>
            orpc.courseProgress.patch.call({ input }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

/**
 * Hook to delete course progress
 */
export function useDeleteCourseProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { id: string }) =>
            orpc.courseProgress.delete.call({ input }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

