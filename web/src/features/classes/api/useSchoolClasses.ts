import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

export type SchoolClassesFilters = {
    school?: string | null;
    level?: string | null;
    search?: string | null;
};

export function useSchools() {
    return useQuery({
        ...orpc.schoolClass.listSchools.queryOptions({}),
        staleTime: 60_000,
    });
}

export function useClassesLevels() {
    return useQuery({
        ...orpc.schoolClass.listLevels.queryOptions({}),
        staleTime: 60_000,
    });
}

export const useSchoolClasses = (filters?: SchoolClassesFilters) => {
    return useQuery({
        queryKey: [
            "schoolClasses",
            filters?.school ?? "all",
            filters?.level ?? "all",
        ],
        queryFn: () =>
            orpc.schoolClass.list.call({
                school: filters?.school ?? undefined,
                level: filters?.level ?? undefined,
            }),
        staleTime: 1000 * 60, // 1 minute
    });
};
