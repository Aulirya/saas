import type { SubjectCategory } from "@saas/shared";

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
    subjectCategory: SubjectCategory;
    level: string;
    className: string;
    weeklyHours: number;
    students: number;
    totalHours: number;
    completedHours: number;
    status: CourseProgramStatus;
    statusLabel: string;
    nextLessons: CourseChapter[];
    completedLessons: CourseChapter[];
    stats: CourseProgramStats;
};
