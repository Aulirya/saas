import type { LucideIcon } from "lucide-react";

export type CourseProgramStatus = "defined" | "partial" | "draft";

export type CourseChapter = {
    id: string;
    title: string;
    plannedHours: number;
    date: Date;
};

export type CourseProgramStats = {
    uploads: number;
    evaluations: number;
    averageLessonMinutes: number;
};

export type CourseProgram = {
    id: string;
    subject: string;
    icon: LucideIcon;
    level: string;
    weeklyHours: number;
    students: number;
    totalHours: number;
    completedHours: number;
    status: CourseProgramStatus;
    statusLabel: string;
    nextLessons: CourseChapter[];
    stats: CourseProgramStats;
};
