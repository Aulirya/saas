import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

/**
 * Hook to get a single lesson progress by ID
 */
export function useLessonProgress(id: string | undefined) {
    return useQuery({
        ...orpc.lessonProgress.get.queryOptions({
            input: { id: id! },
        }),
        enabled: !!id,
        staleTime: 60_000,
    });
}

/**
 * Hook to create a new lesson progress
 */
export function useCreateLessonProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: {
            lesson_id: string;
            course_progress_id: string;
            status?: string;
            scheduled_date?: string | null;
            comments?: Array<{ title?: string; description: string }>;
        }) => orpc.lessonProgress.create.call({ input }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["lessonProgress"],
            });
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

/**
 * Hook to update lesson progress
 */
export function useUpdateLessonProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: {
            id: string;
            status?: string;
            completed_at?: string | null;
            scheduled_date?: string | null;
            comments?: Array<{ title?: string; description: string }>;
        }) => orpc.lessonProgress.patch.call({ input }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["lessonProgress"],
            });
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

/**
 * Hook to delete lesson progress
 */
export function useDeleteLessonProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { id: string }) =>
            orpc.lessonProgress.delete.call({ input }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["lessonProgress"],
            });
            queryClient.invalidateQueries({
                queryKey: ["courseProgress"],
            });
        },
    });
}

