import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";

import type { SchoolClassExtended } from "../types";

export type SchoolClassesFilters = {
    school?: string | null;
    level?: string | null;
    search?: string | null;
};

const demoClasses: SchoolClassExtended[] = [
    {
        id: "terminale-s1",
        name: "Terminale S1",
        level: "Terminale",
        school: "Lycée Jean Moulin",
        year: "2024-2025",
        status: "active",
        statusLabel: "Active",
        colorTheme: "blue",
        icon: GraduationCap,
        studentsCount: 32,
        subjectsCount: 2,
        hoursPerWeek: 26,
        generalAverage: 15.2,
        subjects: [
            {
                id: "math",
                name: "Mathématiques",
                color: "blue",
                hoursPerWeek: 18,
            },
            { id: "chem", name: "Chimie", color: "purple", hoursPerWeek: 8 },
        ],
        upcomingCourses: [
            {
                id: "math-1",
                subject: "Maths",
                title: "Logarithmes",
                date: "Demain",
                time: "8h00",
                color: "blue",
            },
            {
                id: "chem-1",
                subject: "Chimie",
                title: "Équilibres",
                date: "Vendredi",
                time: "10h00",
                color: "purple",
            },
        ],
        statistics: {
            averageAttendance: 94,
            homeworkSubmitted: 87,
            evaluations: 12,
        },
        analyses: [
            {
                type: "success",
                message: "La classe suit parfaitement le rythme prévu",
            },
            {
                type: "warning",
                message: "3 élèves en difficulté en mathématiques",
            },
        ],
        subjectDistribution: [
            {
                subject: "Mathématiques",
                hoursPerWeek: 18,
                percentage: 69,
                color: "blue",
            },
            {
                subject: "Chimie",
                hoursPerWeek: 8,
                percentage: 31,
                color: "purple",
            },
        ],
    },
    {
        id: "premiere-s2",
        name: "Première S2",
        level: "Première",
        school: "Lycée Jean Moulin",
        year: "2024-2025",
        status: "active",
        statusLabel: "Active",
        colorTheme: "green",
        icon: GraduationCap,
        studentsCount: 28,
        subjectsCount: 1,
        hoursPerWeek: 12,
        generalAverage: 13.8,
        subjects: [
            { id: "phys", name: "Physique", color: "green", hoursPerWeek: 12 },
        ],
        upcomingCourses: [
            {
                id: "phys-1",
                subject: "Physique",
                title: "Mécanique",
                date: "Jeudi",
                time: "14h00",
                color: "green",
            },
        ],
        statistics: {
            averageAttendance: 91,
            homeworkSubmitted: 85,
            evaluations: 8,
        },
        analyses: [
            {
                type: "success",
                message: "Progression régulière du groupe",
            },
        ],
        subjectDistribution: [
            {
                subject: "Physique",
                hoursPerWeek: 12,
                percentage: 100,
                color: "green",
            },
        ],
    },
    {
        id: "seconde-a",
        name: "Seconde A",
        level: "Seconde",
        school: "Collège Saint-Exupéry",
        year: "2024-2025",
        status: "paused",
        statusLabel: "En pause",
        colorTheme: "orange",
        icon: GraduationCap,
        studentsCount: 24,
        subjectsCount: 1,
        hoursPerWeek: 8,
        generalAverage: 12.5,
        subjects: [
            {
                id: "math2",
                name: "Mathématiques",
                color: "blue",
                hoursPerWeek: 8,
            },
        ],
        upcomingCourses: [],
        statistics: {
            averageAttendance: 88,
            homeworkSubmitted: 80,
            evaluations: 6,
        },
        analyses: [],
        subjectDistribution: [
            {
                subject: "Mathématiques",
                hoursPerWeek: 8,
                percentage: 100,
                color: "blue",
            },
        ],
    },
];

export function useSchoolClasses(filters?: SchoolClassesFilters | null) {
    return useQuery({
        queryKey: ["school-classes", filters ?? {}],
        queryFn: async ({ queryKey }) => {
            const [, currentFilters] = queryKey as [
                string,
                SchoolClassesFilters | undefined
            ];

            const normalizedSearch = currentFilters?.search
                ?.toLowerCase()
                .trim();

            return demoClasses.filter((schoolClass) => {
                if (
                    currentFilters?.school &&
                    schoolClass.school !== currentFilters.school
                ) {
                    return false;
                }

                if (
                    currentFilters?.level &&
                    schoolClass.level !== currentFilters.level
                ) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                const searchableContent = [
                    schoolClass.name,
                    schoolClass.school,
                    schoolClass.level,
                    schoolClass.year,
                    schoolClass.statusLabel,
                    String(schoolClass.studentsCount),
                    String(schoolClass.subjectsCount),
                    String(schoolClass.hoursPerWeek),
                    String(schoolClass.generalAverage),
                    ...schoolClass.subjects.map((subject) => subject.name),
                    ...schoolClass.upcomingCourses.map(
                        (course) => `${course.subject} ${course.title}`
                    ),
                    ...schoolClass.analyses.map((analysis) => analysis.message),
                ]
                    .join(" ")
                    .toLowerCase();

                return searchableContent.includes(normalizedSearch);
            });
        },
        staleTime: 60_000,
    });
}
