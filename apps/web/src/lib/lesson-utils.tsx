import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  BookOpen,
  Star,
  BookMarked,
} from "lucide-react";

import type { LessonStatus, LessonScope } from "shared";

// Lesson Status Types and Config
export interface StatusConfig {
  label: string;
  variant: "success" | "default" | "outline" | "warning";
  icon: LucideIcon;
}

export const LESSON_STATUS_CONFIG: Record<LessonStatus, StatusConfig> = {
  done: {
    label: "Terminée",
    variant: "success" as const,
    icon: CheckCircle2,
  },
  in_progress: {
    label: "En cours",
    variant: "default" as const,
    icon: PlayCircle,
  },
  to_review: {
    label: "À revoir",
    variant: "outline" as const,
    icon: Circle,
  },
  to_do: {
    label: "À faire",
    variant: "warning" as const,
    icon: Circle,
  },
};

export function getStatusConfig(status: LessonStatus): StatusConfig {
  return LESSON_STATUS_CONFIG[status];
}

// Lesson Scope Types and Config
export interface ScopeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  borderColor: string;
}

export const LESSON_SCOPE_CONFIG: Record<LessonScope, ScopeConfig> = {
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

export function getScopeConfig(scope: LessonScope): ScopeConfig {
  return LESSON_SCOPE_CONFIG[scope] ?? LESSON_SCOPE_CONFIG.core;
}
