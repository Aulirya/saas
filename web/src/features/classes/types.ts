import type { LucideIcon } from "lucide-react";

export type ClassStatus = "active" | "paused";

export type ClassColorTheme = {
    bg: string;
    text: string;
};

export type Subject = {
    id: string;
    name: string;
    color: string;
    hoursPerWeek: number;
};

export type UpcomingCourse = {
    id: string;
    subject: string;
    title: string;
    date: string;
    time: string;
    color: string;
};

export type ClassStatistics = {
    averageAttendance: number;
    homeworkSubmitted: number;
    evaluations: number;
};

export type ClassAnalysis = {
    type: "success" | "warning";
    message: string;
};

export type SchoolClassExtended = {
    id: string;
    name: string;
    level: string;
    school: string;
    year: string;
    status: ClassStatus;
    statusLabel: string;
    colorTheme: ClassColorTheme;
    icon: LucideIcon;
    studentsCount: number;
    subjectsCount: number;
    hoursPerWeek: number;
    generalAverage: number;
    subjects: Subject[];
    upcomingCourses: UpcomingCourse[];
    statistics: ClassStatistics;
    analyses: ClassAnalysis[];
    subjectDistribution: Array<{
        subject: string;
        hoursPerWeek: number;
        percentage: number;
        color: string;
    }>;
};

export type SchoolClass = {
    id: string;
    name: string;
    level: string;
    school: string;
    students_count: number;
    // year: string;
    // statusLabel: string;
};
