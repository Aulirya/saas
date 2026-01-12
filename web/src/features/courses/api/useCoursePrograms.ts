import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useCourseProgress } from "./useCourseProgress";
import { useSubjects } from "@/features/subjects/api/useSubjects";
import { useSchoolClasses } from "@/features/classes/api/useSchoolClasses";
import { transformCourseProgressToProgram } from "../utils/transformCourseProgress";
import type { CourseProgram } from "../types";
import type { CourseProgressWithLessons, Lesson } from "@saas/shared";
import { orpc } from "@/orpc/client";

/**
 * Custom hook to fetch all course progress and transform them to CourseProgram format
 *
 * This hook:
 * 1. Fetches all course progress for the current user
 * 2. Fetches all subjects and classes
 * 3. Fetches all lessons for all subjects
 * 4. Transforms everything to CourseProgram format for the UI
 */
export function useCoursePrograms() {
    // Fetch all course progress
    const { data: allCourseProgress = [], isLoading: isLoadingProgress } =
        useCourseProgress();

    // Fetch all subjects
    const { data: allSubjects = [], isLoading: isLoadingSubjects } =
        useSubjects();

    // Fetch all classes (no filter to get all)
    const { data: allClasses = [], isLoading: isLoadingClasses } =
        useSchoolClasses();

    // Fetch all lessons
    const { data: allLessons = [], isLoading: isLoadingLessons } = useQuery({
        ...orpc.lesson.list.queryOptions({}),
        staleTime: 60_000,
    });

    // Transform data
    const programs = useMemo(() => {
        if (
            isLoadingProgress ||
            isLoadingSubjects ||
            isLoadingClasses ||
            isLoadingLessons ||
            allCourseProgress.length === 0
        ) {
            return [];
        }

        // Create maps for quick lookup
        const subjectsMap = new Map(allSubjects.map((s) => [s.id, s]));
        const classesMap = new Map(allClasses.map((c) => [c.id, c]));
        const lessonsMap = new Map<string, Lesson[]>();

        // Group lessons by subject_id
        allLessons.forEach((lesson) => {
            const subjectId = lesson.subject_id;
            if (!lessonsMap.has(subjectId)) {
                lessonsMap.set(subjectId, []);
            }
            lessonsMap.get(subjectId)!.push(lesson);
        });

        // Transform each course progress to CourseProgram
        const transformed: CourseProgram[] = allCourseProgress
            .map((courseProgress) => {
                const subject = subjectsMap.get(courseProgress.subject_id);
                const schoolClass = classesMap.get(courseProgress.class_id);

                // Skip if subject or class is not found
                if (!subject || !schoolClass) {
                    return null;
                }

                // Get lessons for this subject
                const subjectLessons = lessonsMap.get(subject.id) || [];

                // Create CourseProgressWithLessons object with empty lesson_progress for now
                // We'll fetch lesson_progress separately if needed, but for now we'll calculate from lessons
                const courseProgressWithLessons: CourseProgressWithLessons = {
                    ...courseProgress,
                    lesson_progress: [], // TODO: Fetch lesson_progress if needed for more accurate data
                };

                return transformCourseProgressToProgram(
                    courseProgressWithLessons,
                    subject,
                    schoolClass,
                    subjectLessons
                );
            })
            .filter((program): program is CourseProgram => program !== null);

        return transformed;
    }, [
        allCourseProgress,
        allSubjects,
        allClasses,
        allLessons,
        isLoadingProgress,
        isLoadingSubjects,
        isLoadingClasses,
        isLoadingLessons,
    ]);

    const isLoading =
        isLoadingProgress ||
        isLoadingSubjects ||
        isLoadingClasses ||
        isLoadingLessons;

    return {
        data: programs,
        isLoading,
    };
}
