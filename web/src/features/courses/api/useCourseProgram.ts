import { useQuery } from "@tanstack/react-query";

import type { CourseProgram } from "../types";
import { demoPrograms } from "./useCoursePrograms";

export function useCourseProgram(courseId: string | undefined) {
    return useQuery({
        queryKey: ["course-program", courseId],
        enabled: Boolean(courseId),
        staleTime: 60_000,
        queryFn: async (): Promise<CourseProgram> => {
            if (!courseId) {
                throw new Error("Identifiant de cours manquant");
            }

            const courseData = demoPrograms.find(
                (course) => course.id === courseId
            );

            if (!courseData) {
                throw new Error("Cours introuvable");
            }

            return courseData;
        },
    });
}
