import { useQuery } from "@tanstack/react-query";

import type { SchoolClassExtended } from "../types";
import { demoClasses } from "./useSchoolClasses";

export function useSchoolClass(classId: string | undefined) {
    return useQuery({
        queryKey: ["school-class", classId],
        enabled: Boolean(classId),
        staleTime: 60_000,
        queryFn: async (): Promise<SchoolClassExtended> => {
            if (!classId) {
                throw new Error("Identifiant de classe manquant");
            }

            const classData = demoClasses.find((cls) => cls.id === classId);

            if (!classData) {
                throw new Error("Classe introuvable");
            }

            return classData;
        },
    });
}
