import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCourseProgressWithLessons } from "./useCourseProgress";
import { useSubjects } from "@/features/subjects/api/useSubjects";
import { useSchoolClasses } from "@/features/classes/api/useSchoolClasses";
import { transformCourseProgressToProgram } from "../utils/transformCourseProgress";
import type { CourseProgram } from "../types";
import { orpc } from "@/orpc/client";
import type { Lesson } from "@saas/shared";

/**
 * Hook to fetch a single course progress by ID and transform it to CourseProgram format
 * 
 * This hook:
 * 1. Fetches the course progress with lessons for the given ID
 * 2. Fetches all subjects and classes for lookup
 * 3. Fetches all lessons to calculate statistics
 * 4. Transforms everything to CourseProgram format for the UI
 */
export function useCourseProgram(courseId: string | undefined) {
    // Fetch course progress with lessons
    const {
        data: courseProgress,
        isLoading: isLoadingProgress,
        isError: isErrorProgress,
        error: errorProgress,
    } = useCourseProgressWithLessons(courseId);

    // Fetch all subjects for lookup
    const { data: allSubjects = [], isLoading: isLoadingSubjects } =
        useSubjects();

    // Fetch all classes for lookup
    const { data: allClasses = [], isLoading: isLoadingClasses } =
        useSchoolClasses();

    // Fetch all lessons for calculations
    const { data: allLessons = [], isLoading: isLoadingLessons } = useQuery({
        ...orpc.lesson.list.queryOptions({}),
        staleTime: 60_000,
        enabled: !!courseId,
    });

    // Transform data
    const courseProgram = useMemo(() => {
        if (
            !courseProgress ||
            isLoadingSubjects ||
            isLoadingClasses ||
            isLoadingLessons
        ) {
            return undefined;
        }

        // Create maps for quick lookup
        const subjectsMap = new Map(allSubjects.map((s) => [s.id, s]));
        const classesMap = new Map(allClasses.map((c) => [c.id, c]));

        // Get subject and class
        const subject = subjectsMap.get(courseProgress.subject_id);
        const schoolClass = classesMap.get(courseProgress.class_id);

        // Return undefined if subject or class not found
        if (!subject || !schoolClass) {
            return undefined;
        }

        // Get lessons for this subject
        const subjectLessons = allLessons.filter(
            (lesson) => lesson.subject_id === subject.id
        );

        // Transform to CourseProgram
        return transformCourseProgressToProgram(
            courseProgress,
            subject,
            schoolClass,
            subjectLessons
        );
    }, [
        courseProgress,
        allSubjects,
        allClasses,
        allLessons,
        isLoadingSubjects,
        isLoadingClasses,
        isLoadingLessons,
    ]);

    const isLoading =
        isLoadingProgress ||
        isLoadingSubjects ||
        isLoadingClasses ||
        isLoadingLessons;

    const isError = isErrorProgress;
    const error = errorProgress;

    return {
        data: courseProgram,
        isLoading,
        isError,
        error,
    };
}
