import { useMemo, useState } from "react";
import {
    addDays,
    endOfWeek,
    format,
    isSameDay,
    parseISO,
    startOfWeek,
} from "date-fns";
import type { ScheduledCourse } from "../types";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;

function getWeekdays(date: Date) {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
}

export function useCalendar(initial?: { date?: Date }) {
    const today = new Date();
    const [weekStartDate, setWeekStartDate] = useState<Date>(
        startOfWeek(initial?.date ?? today, { weekStartsOn: 1 })
    );

    const displayedWeek = useMemo(() => {
        const weekdays = getWeekdays(weekStartDate);
        const start = weekdays[0];
        const end = weekdays[4];
        const startDay = format(start, "d");
        const endDay = format(end, "d");
        const sameMonth = format(start, "MMM yyyy") === format(end, "MMM yyyy");
        const startMonth = format(start, "MMM");
        const endMonth = format(end, "MMM");
        const year = format(end, "yyyy");
        return sameMonth
            ? `${startDay}-${endDay} ${endMonth} ${year}`
            : `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    }, [weekStartDate]);

    const goPreviousWeek = () => setWeekStartDate((prev) => addDays(prev, -7));
    const goNextWeek = () => setWeekStartDate((prev) => addDays(prev, 7));

    function computeTimeSlotsForWeek(courses: ScheduledCourse[]) {
        const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
        const weekDays = getWeekdays(weekStartDate);

        const filtered = courses.filter((c) => {
            const d = parseISO(c.date);
            return d >= weekStartDate && d <= weekEnd;
        });

        const hourlySlots: string[] = Array.from(
            { length: Math.max(0, DAY_END_HOUR - DAY_START_HOUR) },
            (_, i) => `${DAY_START_HOUR + i}h-${DAY_START_HOUR + i + 1}h`
        );

        const slotToRange = (
            slot: string
        ): { startHour: number; endHour: number } => {
            const match = slot.match(/^(\d+)h\s*-\s*(\d+)h$/);
            if (!match) {
                const start = parseInt(slot, 10);
                const safeStart = isNaN(start) ? DAY_START_HOUR : start;
                return { startHour: safeStart, endHour: safeStart + 1 };
            }
            const startHour = parseInt(match[1], 10);
            const endHour = parseInt(match[2], 10);
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
            const startHour = parseInt(
                slot.split("h-")[0] || String(DAY_START_HOUR),
                10
            );
            const coursesByDay: any = {};

            for (const day of weekDays) {
                const courseForDay = filtered.find((c) => {
                    if (!isSameDay(parseISO(c.date), day)) return false;
                    const r = slotToRange(c.slot);
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
                    } as const;
                }
            }

            return { time: slot, courses: coursesByDay };
        });

        return timeSlots;
    }

    return {
        weekStartDate,
        displayedWeek,
        weekDays: getWeekdays(weekStartDate),
        goPreviousWeek,
        goNextWeek,
        computeTimeSlotsForWeek,
    } as const;
}
