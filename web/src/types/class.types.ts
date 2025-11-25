import type { ComponentType } from "react";

export type Lesson = {
    id: string;
    label: string;
    start_at?: string;
    end_at?: string;
};

export type SubjectWithLessons = {
    id: string;
    name: string;
    category: string;
    lessons?: Lesson[];
};

export type LessonWithSubject = {
    id: string;
    label: string;
    start_at?: string;
    end_at?: string;
    subject_name: string;
};

export type Subject = {
    id: string;
    name: string;
    category: string;
};

export type MetricConfig = {
    icon: ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
};

export type DetailMetricProps = {
    label: string;
    value: string | number;
};

export type EmptyStateProps = {
    title: string;
    description: string;
};
