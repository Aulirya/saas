import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

// Not used for the moment, check later if need to remove
export function useSchoolClass(classId: string) {
    return useQuery({
        ...orpc.schoolClass.get.queryOptions({
            input: { id: classId },
        }),
        staleTime: 60_000,
    });
}

export function useSchoolClassWithSubjects(classId: string) {
    return useQuery({
        ...orpc.schoolClass.getWithSubjects.queryOptions({
            input: { id: classId },
        }),
        staleTime: 60_000,
    });
}
