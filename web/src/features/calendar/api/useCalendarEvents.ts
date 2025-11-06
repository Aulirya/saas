import { useQuery } from "@tanstack/react-query";
import type { ScheduledCourse } from "../types";

// Temporary demo data; replace with real API calls later
const demoCourses: ScheduledCourse[] = [
    {
        id: "c1",
        subject: "Math Terminale S",
        level: "Terminale S",
        color: "blue",
        date: "2025-10-20",
        slot: "8h-10h",
    },
    {
        id: "c2",
        subject: "Physique 2nde",
        level: "2nde",
        color: "green",
        date: "2025-10-21",
        slot: "10h-12h",
    },
    {
        id: "c3",
        subject: "Chimie 1ère S",
        level: "1ère S",
        color: "purple",
        date: "2025-10-22",
        slot: "8h-10h",
    },
    {
        id: "c4",
        subject: "Math 2nde",
        level: "2nde",
        color: "blue",
        date: "2025-11-05",
        slot: "14h-16h",
    },
    {
        id: "c5",
        subject: "Physique 1ère S",
        level: "1ère S",
        color: "green",
        date: "2025-11-08",
        slot: "10h-12h",
    },
];

export function useCalendarEvents(params: {
    startISO: string;
    endISO: string;
}) {
    return useQuery({
        queryKey: ["calendarEvents", params],
        // Replace with real fetch call using params
        queryFn: async () => demoCourses,
        staleTime: 60_000,
    });
}
