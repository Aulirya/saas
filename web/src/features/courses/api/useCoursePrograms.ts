import { useQuery } from "@tanstack/react-query";
import { Atom, Calculator, FlaskConical } from "lucide-react";

import type { CourseProgram } from "../types";

export const demoPrograms: CourseProgram[] = [
    {
        id: "math-terminale-s",
        subject: "Mathématiques",
        icon: Calculator,
        level: "Terminale S",
        weeklyHours: 18,
        students: 32,
        totalHours: 156,
        completedHours: 42,
        status: "defined",
        statusLabel: "Programme défini",
        nextChapters: [
            {
                id: "log-functions",
                title: "Fonctions logarithmes",
                plannedHours: 8,
            },
            { id: "integrales", title: "Intégrales", plannedHours: 12 },
        ],
        stats: {
            uploads: 24,
            evaluations: 6,
            averageLessonMinutes: 135,
        },
    },
    {
        id: "physics-premiere-s",
        subject: "Physique",
        icon: Atom,
        level: "1ère S",
        weeklyHours: 12,
        students: 28,
        totalHours: 120,
        completedHours: 38,
        status: "partial",
        statusLabel: "Programme partiel",
        nextChapters: [
            { id: "optics", title: "Optique avancée", plannedHours: 6 },
            {
                id: "thermodynamics",
                title: "Thermodynamique",
                plannedHours: 10,
            },
        ],
        stats: {
            uploads: 18,
            evaluations: 4,
            averageLessonMinutes: 120,
        },
    },
    {
        id: "chemistry-seconde",
        subject: "Chimie",
        icon: FlaskConical,
        level: "2nde",
        weeklyHours: 8,
        students: 25,
        totalHours: 96,
        completedHours: 28,
        status: "draft",
        statusLabel: "Programme à définir",
        nextChapters: [
            { id: "stoichiometry", title: "Stœchiométrie", plannedHours: 5 },
            {
                id: "chemical-bonds",
                title: "Liaisons chimiques",
                plannedHours: 7,
            },
        ],
        stats: {
            uploads: 11,
            evaluations: 3,
            averageLessonMinutes: 110,
        },
    },
];

export function useCoursePrograms() {
    return useQuery({
        queryKey: ["course-programs"],
        queryFn: async () => demoPrograms,
        staleTime: 60_000,
    });
}
