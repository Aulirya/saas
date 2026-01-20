export type CourseColor = "blue" | "purple" | "green";

export type ScheduledCourse = {
    id: string;
    subject: string;
    level: string;
    color: CourseColor;
    // use a lib or create a type to handle dates
    date: string; // ISO date (yyyy-MM-dd)
    slot: string; // e.g. "8h-10h"
    // Optional fields for editing
    lessonProgressId?: string;
    courseProgressId?: string;
    lessonId?: string;
};

export type CalendarView = "week" | "month" | "day";

export type DateRange = { start: string; end: string };
