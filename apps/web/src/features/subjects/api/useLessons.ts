import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";

interface UseLessonsOptions {
    subjectId?: string;
}

export function useLessons(options?: UseLessonsOptions) {
    const queryClient = useQueryClient();
    const { subjectId } = options || {};

    const invalidateLessonQueries = () => {
        queryClient.invalidateQueries({ queryKey: ["lessons"] });
        queryClient.invalidateQueries({
            queryKey: orpc.lesson.list.queryKey({}),
        });
        if (subjectId) {
            queryClient.invalidateQueries({
                queryKey: orpc.subject.getWithLessons.queryKey({
                    input: { id: subjectId },
                }),
            });
        }
    };

    const { mutate: updateLessonComments } = useMutation({
        mutationFn: async (params: {
            id: string;
            comments: { title: string; description: string }[];
        }) => {
            return await orpc.lesson.patch.call({
                id: params.id,
                comments: params.comments,
            });
        },
        onSuccess: () => {
            invalidateLessonQueries();
            toast.success("Commentaires de la leçon mis à jour");
        },
        onError: (error: unknown) => {
            console.error("Error updating lesson comments:", error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";
            toast.error(errorMsg);
        },
    });

    const { mutate: deleteLesson } = useMutation({
        mutationFn: async (params: {
            id: string;
            order: number | null;
            subject_id: string;
        }) => {
            return await orpc.lesson.delete.call({
                id: params.id,
                order: params.order ?? (null as number | null),
                subject_id: params.subject_id,
            });
        },
        onSuccess: () => {
            invalidateLessonQueries();
            toast.success("Leçon supprimée avec succès");
        },
        onError: (error: unknown) => {
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";
            toast.error(errorMsg);
        },
    });

    const { mutate: updateLessonStatus } = useMutation({
        mutationFn: async (params: {
            id: string;
            status: "done" | "to_review" | "in_progress" | "to_do";
        }) => {
            return await orpc.lesson.patch.call({
                id: params.id,
                status: params.status,
            });
        },
        onSuccess: () => {
            invalidateLessonQueries();
            toast.success("Statut de la leçon mis à jour");
        },
        onError: (error: unknown) => {
            console.error("Error updating lesson status:", error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";
            toast.error(errorMsg);
        },
    });

    const { mutate: reorderLesson } = useMutation({
        mutationFn: async (params: {
            lesson_id: string;
            target_lesson_id: string;
            subject_id: string;
        }) => {
            const { lesson_id, target_lesson_id, subject_id } = params;

            if (!target_lesson_id || !subject_id) {
                return;
            }

            return await orpc.lesson.reorder.call({
                lesson_id,
                target_lesson_id,
                subject_id,
            });
        },
        onSuccess: () => {
            invalidateLessonQueries();
        },
        onError: (error: unknown) => {
            console.error("Error reordering lesson:", error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors du déplacement";
            toast.error(errorMsg);
        },
    });

    return {
        updateLessonComments,
        deleteLesson,
        updateLessonStatus,
        reorderLesson,
    };
}
