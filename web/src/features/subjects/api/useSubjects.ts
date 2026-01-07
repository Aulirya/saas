import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

export function useSubjects() {
    return useQuery({
        ...orpc.subject.list.queryOptions({}),
        staleTime: 60_000,
    });
}

export function useSubjectWithLessons(
    subjectId: string,
    options?: { enabled?: boolean }
) {
    return useQuery({
        ...orpc.subject.getWithLessons.queryOptions({
            input: { id: subjectId },
        }),
        staleTime: 60_000,
        enabled: options?.enabled !== false && !!subjectId,
    });
}
