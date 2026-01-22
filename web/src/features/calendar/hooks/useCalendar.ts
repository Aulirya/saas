import { useEffect, useMemo, useState } from "react";
import {
    addDays,
    endOfWeek,
    format,
    isSameDay,
    parseISO,
    startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { ScheduledCourse } from "../types";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;

function getWeekdays(date: Date) {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
}

export function useCalendar(initial?: { date?: Date }) {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState<Date>(
        initial?.date ?? today
    );
    useEffect(() => {
        if (!initial?.date) return;
        const nextDate = initial.date;
        setCurrentDate((prev) => (isSameDay(prev, nextDate) ? prev : nextDate));
    }, [initial?.date]);
    const weekStartDate = useMemo(
        () => startOfWeek(currentDate, { weekStartsOn: 1 }),
        [currentDate]
    );

    const displayedWeek = useMemo(() => {
        const weekdays = getWeekdays(weekStartDate);
        const start = weekdays[0];
        const end = weekdays[4];
        const sameMonth =
            format(start, "MMMM yyyy", { locale: fr }) ===
            format(end, "MMMM yyyy", { locale: fr });
        const sameYear =
            format(start, "yyyy", { locale: fr }) ===
            format(end, "yyyy", { locale: fr });
        const startMonth = format(start, "MMMM", { locale: fr });
        const endMonth = format(end, "MMMM", { locale: fr });
        const startYear = format(start, "yyyy", { locale: fr });
        const endYear = format(end, "yyyy", { locale: fr });

        if (sameMonth) {
            return `${endMonth} ${endYear}`;
        }

        if (sameYear) {
            return `${startMonth} - ${endMonth} ${endYear}`;
        }

        return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    }, [weekStartDate]);

    const goPreviousWeek = () => setCurrentDate((prev) => addDays(prev, -7));
    const goNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));
    const goToDate = (date: Date) => setCurrentDate(date);
    const goToToday = () => setCurrentDate(new Date());

    function computeTimeSlotsForWeek(courses: ScheduledCourse[]) {
        const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
        const weekDays = getWeekdays(weekStartDate);

        const filtered = courses.filter((c) => {
            const d = parseISO(c.date);
            return d >= weekStartDate && d <= weekEnd;
        });

        const hourlySlots: string[] = Array.from(
            { length: Math.max(0, DAY_END_HOUR - DAY_START_HOUR) },
            (_, i) => `${DAY_START_HOUR + i}:00`
        );

        const courseToRange = (
            startDateTime: string,
            endDateTime: string
        ): { startHour: number; endHour: number } => {
            const start = parseISO(startDateTime);
            const end = parseISO(endDateTime);
            const startHour =
                start.getUTCHours() + start.getUTCMinutes() / 60;
            let endHour = end.getUTCHours() + end.getUTCMinutes() / 60;
            if (endHour <= startHour) {
                endHour = startHour + 1;
            }
            return { startHour, endHour };
        };

        const weekdayKey = (
            d: Date
        ): "monday" | "tuesday" | "wednesday" | "thursday" | "friday" => {
            const idx = d.getDay();
            switch (idx) {
                case 1:
                    return "monday";
                case 2:
                    return "tuesday";
                case 3:
                    return "wednesday";
                case 4:
                    return "thursday";
                case 5:
                    return "friday";
                default:
                    return "monday";
            }
        };

        const timeSlots = hourlySlots.map((slot) => {
            const startHour = parseInt(slot, 10);
            const coursesByDay: any = {};

            for (const day of weekDays) {
                const courseForDay = filtered.find((c) => {
                    if (!isSameDay(parseISO(c.startDateTime), day))
                        return false;
                    const r = courseToRange(c.startDateTime, c.endDateTime);
                    return startHour >= r.startHour && startHour < r.endHour;
                });
                if (courseForDay) {
                    const key = weekdayKey(day);
                    coursesByDay[key] = {
                        id: courseForDay.id,
                        subject_name: courseForDay.subject_name,
                        subject_category: courseForDay.subject_category,
                        class_name: courseForDay.class_name,
                        class_level: courseForDay.class_level,
                        lesson_label: courseForDay.lesson_label,
                        startDateTime: courseForDay.startDateTime,
                        endDateTime: courseForDay.endDateTime,
                    } as const;
                }
            }

            return { time: slot, courses: coursesByDay };
        });

        return timeSlots;
    }

    return {
        currentDate,
        weekStartDate,
        displayedWeek,
        weekDays: getWeekdays(weekStartDate),
        goPreviousWeek,
        goNextWeek,
        goToDate,
        goToToday,
        computeTimeSlotsForWeek,
    } as const;
}
