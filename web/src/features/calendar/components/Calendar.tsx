import { addDays, format } from "date-fns";
import { WeeklySchedule } from "@/components/journal/weekly_schedule";
import { useCalendar } from "../hooks/useCalendar";
import { useCalendarEvents } from "../api/useCalendarEvents";

export function Calendar() {
    const {
        weekStartDate,
        displayedWeek,
        computeTimeSlotsForWeek,
        goNextWeek,
        goPreviousWeek,
    } = useCalendar();

    const startISO = format(weekStartDate, "yyyy-MM-dd");
    const endISO = format(addDays(weekStartDate, 6), "yyyy-MM-dd");
    const { data: courses = [] } = useCalendarEvents({ startISO, endISO });

    const timeSlots = computeTimeSlotsForWeek(courses);

    return (
        <WeeklySchedule
            weekLabel={displayedWeek}
            onPreviousWeek={goPreviousWeek}
            onNextWeek={goNextWeek}
            timeSlots={timeSlots}
        />
    );
}
