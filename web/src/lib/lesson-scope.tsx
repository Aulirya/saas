import type { LucideIcon } from "lucide-react";
import { BookOpen, Star, BookMarked } from "lucide-react";

export type LessonScope = "core" | "bonus" | "optional";

export interface ScopeConfig {
    label: string; // French label
    icon: LucideIcon;
    color: string; // Tailwind color class for background
    iconColor: string; // Tailwind color class for icon
    borderColor: string; // Tailwind color class for border
}

export const SCOPE_CONFIG: Record<LessonScope, ScopeConfig> = {
    core: {
        label: "Tronc commun",
        icon: BookOpen,
        color: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-700 dark:text-blue-400",
        borderColor: "border-blue-200 dark:border-blue-800",
    },
    bonus: {
        label: "Bonus",
        icon: Star,
        color: "bg-amber-100 dark:bg-amber-900/30",
        iconColor: "text-amber-700 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800",
    },
    optional: {
        label: "Optionnel",
        icon: BookMarked,
        color: "bg-purple-100 dark:bg-purple-900/30",
        iconColor: "text-purple-700 dark:text-purple-400",
        borderColor: "border-purple-200 dark:border-purple-800",
    },
};

/**
 * Get the French label for a lesson scope
 */
export function getScopeLabel(scope: LessonScope): string {
    return SCOPE_CONFIG[scope]?.label ?? scope;
}

/**
 * Get the icon component for a lesson scope
 */
export function getScopeIcon(scope: LessonScope): LucideIcon {
    return SCOPE_CONFIG[scope]?.icon ?? BookOpen;
}

/**
 * Get the color configuration for a lesson scope
 */
export function getScopeConfig(scope: LessonScope): ScopeConfig {
    return SCOPE_CONFIG[scope] ?? SCOPE_CONFIG.core;
}
