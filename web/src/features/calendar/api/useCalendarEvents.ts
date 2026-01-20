import { parseISO, getHours } from "date-fns";
import type { ScheduledCourse } from "../types";
import { useMemo } from "react";
import { useAllLessonsForCalendar } from "@/features/courses/api/useCourseProgress";

/**
 * Format scheduled_date to a slot string
 */
function formatSlotFromDate(dateString: string | null | undefined): string {
    if (!dateString) return "8h-9h";
    try {
        const date = parseISO(dateString);
        const hour = getHours(date);
        const nextHour = hour + 1;
        return `${hour}h-${nextHour}h`;
    } catch {
        return "8h-9h";
    }
}

export function useCalendarEvents(params: {
    startISO: string;
    endISO: string;
}) {
    const { data: allLessonsForCalendar = [], isLoading } =
        useAllLessonsForCalendar();

    const events = useMemo(() => {
        return allLessonsForCalendar
            .filter((lp) => {
                if (!lp.scheduled_date) return false;
                const scheduledDate = lp.scheduled_date.split("T")[0];
                return (
                    scheduledDate >= params.startISO &&
                    scheduledDate <= params.endISO
                );
            })
            .map((lp) => {
                const scheduledDate = lp.scheduled_date?.split("T")[0] || "";
                return {
                    id: lp.id,
                    subject: lp.subject_name,
                    level: lp.class_name,
                    color: "blue",
                    date: scheduledDate,
                    slot: formatSlotFromDate(lp.scheduled_date),
                    lessonProgressId: lp.id,
                    courseProgressId: lp.course_progress_id,
                    lessonId: lp.lesson_id,
                } satisfies ScheduledCourse;
            });
    }, [allLessonsForCalendar, params.startISO, params.endISO]);

    return { data: events, isLoading };
}
