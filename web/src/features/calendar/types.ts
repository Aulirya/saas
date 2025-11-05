export type CourseColor = "blue" | "purple" | "green";

export type ScheduledCourse = {
    id: string;
    subject: string;
    level: string;
    color: CourseColor;
    date: string; // ISO date (yyyy-MM-dd)
    slot: string; // e.g. "8h-10h"
};

export type CalendarView = "week" | "month" | "day";

export type DateRange = { start: string; end: string };
