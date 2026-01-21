export type CourseColor = "blue" | "purple" | "green";

export type ScheduledCourse = {
    id: string;
    subject_name: string;
    subject_category: string;
    class_name: string;
    class_level: string;
    lesson_label: string;
    date: string;
    slot: string;
};

export type CalendarView = "week" | "month" | "day";

export type DateRange = { start: string; end: string };
