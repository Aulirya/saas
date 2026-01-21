import { addMinutes, parseISO } from "date-fns";
import type { ScheduledCourse } from "../types";
import { useMemo } from "react";
import { useAllLessonsForCalendar } from "@/features/courses/api/useCourseProgress";

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
                const startDateTime = lp.scheduled_date || "";
                const durationMinutes =
                    typeof lp.scheduled_duration === "number"
                        ? lp.scheduled_duration
                        : typeof lp.lesson_duration === "number"
                        ? lp.lesson_duration
                        : 60;
                const endDateTime = lp.scheduled_date
                    ? addMinutes(
                          parseISO(lp.scheduled_date),
                          durationMinutes
                      ).toISOString()
                    : "";
                return {
                    id: lp.id,
                    subject_name: lp.subject_name,
                    subject_category: lp.subject_category,
                    class_name: lp.class_name,
                    class_level: lp.class_level,
                    lesson_label: lp.lesson_label,
                    date: scheduledDate,
                    startDateTime,
                    endDateTime,
                } satisfies ScheduledCourse;
            });
    }, [allLessonsForCalendar, params.startISO, params.endISO]);

    return { data: events, isLoading };
}
