import type { LucideIcon } from "lucide-react";
import {
    BookOpen,
    Calculator,
    Languages,
    FlaskConical,
    Users,
    BookText,
    Dumbbell,
    Landmark,
    Globe,
    Lightbulb,
    Scale,
    Music,
    Palette,
    Cpu,
    Code,
    TrendingUp,
    FolderOpen,
} from "lucide-react";

import type { SubjectCategory, SubjectType } from "@saas/shared";

// ----- CATEGORY UTILS -----
export interface CategoryConfig {
    label: string; // French label
    icon: LucideIcon;
    color: string; // Tailwind color class for background
    iconColor: string; // Tailwind color class for icon
    buttonColor: string; // Tailwind color class for button background
    buttonHoverColor: string; // Tailwind color class for button hover state
}

// ----- TYPE UTILS -----
export interface TypeConfig {
    label: string; // French label
    icon: LucideIcon;
    color: string; // Tailwind color class for background
    iconColor: string; // Tailwind color class for icon
    buttonColor: string; // Tailwind color class for button background
    buttonHoverColor: string; // Tailwind color class for button hover state
}

export const CATEGORY_CONFIG: Record<SubjectCategory, CategoryConfig> = {
    Mathematics: {
        label: "Mathématiques",
        icon: Calculator,
        color: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        buttonColor: "bg-blue-600 dark:bg-blue-500",
        buttonHoverColor: "hover:bg-blue-700 dark:hover:bg-blue-600",
    },
    Language: {
        label: "Langues",
        icon: Languages,
        color: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        buttonColor: "bg-green-600 dark:bg-green-500",
        buttonHoverColor: "hover:bg-green-700 dark:hover:bg-green-600",
    },
    Science: {
        label: "Sciences",
        icon: FlaskConical,
        color: "bg-purple-100 dark:bg-purple-900/30",
        iconColor: "text-purple-600 dark:text-purple-400",
        buttonColor: "bg-purple-600 dark:bg-purple-500",
        buttonHoverColor: "hover:bg-purple-700 dark:hover:bg-purple-600",
    },
    Social: {
        label: "Sciences sociales",
        icon: Users,
        color: "bg-orange-100 dark:bg-orange-900/30",
        iconColor: "text-orange-600 dark:text-orange-400",
        buttonColor: "bg-orange-600 dark:bg-orange-500",
        buttonHoverColor: "hover:bg-orange-700 dark:hover:bg-orange-600",
    },
    Literature: {
        label: "Littérature",
        icon: BookText,
        color: "bg-pink-100 dark:bg-pink-900/30",
        iconColor: "text-pink-600 dark:text-pink-400",
        buttonColor: "bg-pink-600 dark:bg-pink-500",
        buttonHoverColor: "hover:bg-pink-700 dark:hover:bg-pink-600",
    },
    Sport: {
        label: "Sport",
        icon: Dumbbell,
        color: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        buttonColor: "bg-red-600 dark:bg-red-500",
        buttonHoverColor: "hover:bg-red-700 dark:hover:bg-red-600",
    },
    History: {
        label: "Histoire",
        icon: Landmark,
        color: "bg-amber-100 dark:bg-amber-900/30",
        iconColor: "text-amber-600 dark:text-amber-400",
        buttonColor: "bg-amber-600 dark:bg-amber-500",
        buttonHoverColor: "hover:bg-amber-700 dark:hover:bg-amber-600",
    },
    Geography: {
        label: "Géographie",
        icon: Globe,
        color: "bg-teal-100 dark:bg-teal-900/30",
        iconColor: "text-teal-600 dark:text-teal-400",
        buttonColor: "bg-teal-600 dark:bg-teal-500",
        buttonHoverColor: "hover:bg-teal-700 dark:hover:bg-teal-600",
    },
    Philosophy: {
        label: "Philosophie",
        icon: Lightbulb,
        color: "bg-yellow-100 dark:bg-yellow-900/30",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        buttonColor: "bg-yellow-600 dark:bg-yellow-500",
        buttonHoverColor: "hover:bg-yellow-700 dark:hover:bg-yellow-600",
    },
    Civic: {
        label: "Éducation civique",
        icon: Scale,
        color: "bg-indigo-100 dark:bg-indigo-900/30",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        buttonColor: "bg-indigo-600 dark:bg-indigo-500",
        buttonHoverColor: "hover:bg-indigo-700 dark:hover:bg-indigo-600",
    },
    Music: {
        label: "Musique",
        icon: Music,
        color: "bg-rose-100 dark:bg-rose-900/30",
        iconColor: "text-rose-600 dark:text-rose-400",
        buttonColor: "bg-rose-600 dark:bg-rose-500",
        buttonHoverColor: "hover:bg-rose-700 dark:hover:bg-rose-600",
    },
    Art: {
        label: "Arts",
        icon: Palette,
        color: "bg-violet-100 dark:bg-violet-900/30",
        iconColor: "text-violet-600 dark:text-violet-400",
        buttonColor: "bg-violet-600 dark:bg-violet-500",
        buttonHoverColor: "hover:bg-violet-700 dark:hover:bg-violet-600",
    },
    Technology: {
        label: "Technologie",
        icon: Cpu,
        color: "bg-cyan-100 dark:bg-cyan-900/30",
        iconColor: "text-cyan-600 dark:text-cyan-400",
        buttonColor: "bg-cyan-600 dark:bg-cyan-500",
        buttonHoverColor: "hover:bg-cyan-700 dark:hover:bg-cyan-600",
    },
    "Computer Science": {
        label: "Informatique",
        icon: Code,
        color: "bg-slate-100 dark:bg-slate-900/30",
        iconColor: "text-slate-600 dark:text-slate-400",
        buttonColor: "bg-slate-600 dark:bg-slate-500",
        buttonHoverColor: "hover:bg-slate-700 dark:hover:bg-slate-600",
    },
    Economics: {
        label: "Économie",
        icon: TrendingUp,
        color: "bg-emerald-100 dark:bg-emerald-900/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        buttonColor: "bg-emerald-600 dark:bg-emerald-500",
        buttonHoverColor: "hover:bg-emerald-700 dark:hover:bg-emerald-600",
    },
    Other: {
        label: "Autre",
        icon: FolderOpen,
        color: "bg-gray-100 dark:bg-gray-900/30",
        iconColor: "text-gray-600 dark:text-gray-400",
        buttonColor: "bg-gray-600 dark:bg-gray-500",
        buttonHoverColor: "hover:bg-gray-700 dark:hover:bg-gray-600",
    },
};

export function getCategoryLabel(category: SubjectCategory): string {
    return CATEGORY_CONFIG[category]?.label ?? category;
}

export function getCategoryIcon(category: SubjectCategory): LucideIcon {
    return CATEGORY_CONFIG[category]?.icon ?? BookOpen;
}

export function getCategoryConfig(category: SubjectCategory): CategoryConfig {
    return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.Other;
}

// ----- TYPE UTILS -----
export const TYPE_CONFIG: Record<SubjectType, TypeConfig> = {
    core: {
        label: "Tronc commun",
        icon: BookOpen,
        color: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        buttonColor: "bg-blue-600 dark:bg-blue-500",
        buttonHoverColor: "hover:bg-blue-700 dark:hover:bg-blue-600",
    },
    option: {
        label: "Option",
        icon: BookOpen,
        color: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400",
        buttonColor: "bg-green-600 dark:bg-green-500",
        buttonHoverColor: "hover:bg-green-700 dark:hover:bg-green-600",
    },
    support: {
        label: "Soutien",
        icon: BookOpen,
        color: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        buttonColor: "bg-red-600 dark:bg-red-500",
        buttonHoverColor: "hover:bg-red-700 dark:hover:bg-red-600",
    },
};

export function getSubjectTypeLabel(type: SubjectType): string {
    return TYPE_CONFIG[type]?.label ?? type;
}

export function getSubjectTypeIcon(type: SubjectType): LucideIcon {
    return TYPE_CONFIG[type]?.icon ?? BookOpen;
}

export function getSubjectTypeConfig(type: SubjectType): TypeConfig {
    return TYPE_CONFIG[type] ?? TYPE_CONFIG.core;
}
