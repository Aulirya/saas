import type { LucideIcon } from "lucide-react";
import { GraduationCap } from "lucide-react";

export interface ClassConfig {
    icon: LucideIcon;
    bgColor: string; // Background color for icon container
    iconColor: string; // Icon color
    buttonColor: string; // Button background
    buttonHoverColor: string; // Button hover state
    ringColor?: string; // Border color
    ringHoverColor?: string; // Border hover color
}

type EducationalLevel = "primary" | "middle" | "high";
type Country = "FR" | "BE";

/**
 * Detects the country from the level string format
 */
function detectCountry(level: string): Country {
    const levelLower = level.toLowerCase().trim();

    // Belgian levels explicitly contain "primaire" or "secondaire"
    if (levelLower.includes("primaire") || levelLower.includes("secondaire")) {
        return "BE";
    }

    // French levels use CP, CE, CM, or numbered "ème" without explicit school type
    // Default to FR
    return "FR";
}

/**
 * Determines the educational level from a class level string
 */
function getEducationalLevel(
    level: string,
    country: Country
): EducationalLevel {
    const levelLower = level.toLowerCase().trim();

    if (country === "BE") {
        // Belgian system
        // Primary: contains "primaire"
        if (levelLower.includes("primaire")) {
            return "primary";
        }

        // Secondary: contains "secondaire"
        if (levelLower.includes("secondaire")) {
            return "high"; // Belgian secondary corresponds to high school level
        }

        // Default to primary if unclear
        return "primary";
    }

    // French system
    // Primary School (École primaire)
    // CP, CE1, CE2, CM1, CM2
    if (
        levelLower === "cp" ||
        levelLower.startsWith("ce") ||
        levelLower.startsWith("cm")
    ) {
        return "primary";
    }

    // Middle School (Collège)
    // 6ème, 5ème, 4ème, 3ème (but NOT "6ème primaire" which would be Belgian)
    if (
        levelLower.includes("6ème") ||
        levelLower.includes("5ème") ||
        levelLower.includes("4ème") ||
        levelLower.includes("3ème")
    ) {
        // Ensure it's not Belgian format
        if (
            !levelLower.includes("primaire") &&
            !levelLower.includes("secondaire")
        ) {
            return "middle";
        }
    }

    // High School (Lycée)
    // 2nde, 1ère (but not "1ère primaire"), Terminale
    if (
        levelLower === "2nde" ||
        levelLower === "terminale" ||
        (levelLower.includes("1ère") &&
            !levelLower.includes("primaire") &&
            !levelLower.includes("secondaire"))
    ) {
        return "high";
    }

    // Default to primary if unclear
    return "primary";
}

/**
 * Gets the progression index within an educational level for shade variation
 * Returns 0-based index for progression (0 = lightest, higher = darker)
 */
function getProgressionIndex(
    level: string,
    educationalLevel: EducationalLevel,
    country: Country
): number {
    const levelLower = level.toLowerCase().trim();

    if (educationalLevel === "primary") {
        if (country === "FR") {
            // French Primary: CP (0), CE1 (1), CE2 (2), CM1 (3), CM2 (4)
            if (levelLower === "cp") return 0;
            if (levelLower === "ce1") return 1;
            if (levelLower === "ce2") return 2;
            if (levelLower === "cm1") return 3;
            if (levelLower === "cm2") return 4;
        } else {
            // Belgian Primary: Extract number from "Xème primaire"
            // 1ère primaire (0), 2ème primaire (1), ..., 6ème primaire (5)
            const primaireMatch = levelLower.match(/(\d+)ème primaire/);
            if (primaireMatch) {
                return Math.min(parseInt(primaireMatch[1], 10) - 1, 5);
            }
        }
    }

    if (educationalLevel === "middle") {
        // French Middle School only: 6ème (0), 5ème (1), 4ème (2), 3ème (3)
        if (country === "FR") {
            if (levelLower.includes("6ème")) return 0;
            if (levelLower.includes("5ème")) return 1;
            if (levelLower.includes("4ème")) return 2;
            if (levelLower.includes("3ème")) return 3;
        }
    }

    if (educationalLevel === "high") {
        if (country === "FR") {
            // French High School: 2nde (0), 1ère (1), Terminale (2)
            if (levelLower === "2nde") return 0;
            if (
                levelLower.includes("1ère") &&
                !levelLower.includes("primaire") &&
                !levelLower.includes("secondaire")
            )
                return 1;
            if (levelLower.includes("terminale")) return 2;
        } else {
            // Belgian Secondary: Extract number from "Xème secondaire"
            // 1ère secondaire (0), 2ème secondaire (1), ..., 6ème secondaire (5)
            const secondaireMatch = levelLower.match(/(\d+)ème secondaire/);
            if (secondaireMatch) {
                return Math.min(parseInt(secondaireMatch[1], 10) - 1, 5);
            }
        }
    }

    return 0;
}

//  * Color configurations for each educational level
const EDUCATIONAL_LEVEL_COLORS: Record<
    EducationalLevel,
    {
        bgColors: string[];
        iconColors: string[];
        buttonColors: string[];
        buttonHoverColors: string[];
        ringColors?: string[];
        ringHoverColors?: string[];
    }
> = {
    primary: {
        // Blue family for Primary School - warm, friendly
        bgColors: [
            "bg-blue-50 dark:bg-blue-950/40",
            "bg-blue-100 dark:bg-blue-900/40",
            "bg-blue-200 dark:bg-blue-800/40",
            "bg-blue-300 dark:bg-blue-700/40",
            "bg-blue-400 dark:bg-blue-600/40",
            "bg-blue-500 dark:bg-blue-500/40",
        ],
        iconColors: [
            "text-blue-400 dark:text-blue-500",
            "text-blue-500 dark:text-blue-400",
            "text-blue-600 dark:text-blue-400",
            "text-blue-700 dark:text-blue-300",
            "text-blue-800 dark:text-blue-200",
            "text-blue-900 dark:text-blue-100",
        ],
        buttonColors: [
            "bg-blue-500 dark:bg-blue-600",
            "bg-blue-600 dark:bg-blue-500",
            "bg-blue-700 dark:bg-blue-500",
            "bg-blue-700 dark:bg-blue-400",
            "bg-blue-800 dark:bg-blue-400",
            "bg-blue-800 dark:bg-blue-300",
        ],
        buttonHoverColors: [
            "hover:bg-blue-600 dark:hover:bg-blue-700",
            "hover:bg-blue-700 dark:hover:bg-blue-600",
            "hover:bg-blue-800 dark:hover:bg-blue-600",
            "hover:bg-blue-800 dark:hover:bg-blue-500",
            "hover:bg-blue-900 dark:hover:bg-blue-500",
            "hover:bg-blue-900 dark:hover:bg-blue-400",
        ],
        ringColors: [
            "ring-2 shadow ring-blue-200 dark:ring-blue-800",
            "ring-2 shadow ring-blue-300 dark:ring-blue-700",
            "ring-2 shadow ring-blue-400 dark:ring-blue-600",
            "ring-2 shadow ring-blue-500 dark:ring-blue-500",
            "ring-2 shadow ring-blue-600 dark:ring-blue-400",
            "ring-2 shadow ring-blue-700 dark:ring-blue-300",
        ],
        ringHoverColors: [
            "hover:ring hover:ring-blue-300 dark:hover:ring-blue-700",
            "hover:ring hover:ring-blue-400 dark:hover:ring-blue-600",
            "hover:ring hover:ring-blue-500 dark:hover:ring-blue-500",
            "hover:ring hover:ring-blue-600 dark:hover:ring-blue-400",
            "hover:ring hover:ring-blue-700 dark:hover:ring-blue-300",
            "hover:ring hover:ring-blue-800 dark:hover:ring-blue-200",
        ],
    },
    middle: {
        // Green family for Middle School - growth, transition
        bgColors: [
            "bg-green-50 dark:bg-green-950/40",
            "bg-green-100 dark:bg-green-900/40",
            "bg-green-200 dark:bg-green-800/40",
            "bg-green-300 dark:bg-green-700/40",
        ],
        iconColors: [
            "text-green-400 dark:text-green-500",
            "text-green-500 dark:text-green-400",
            "text-green-600 dark:text-green-400",
            "text-green-700 dark:text-green-300",
        ],
        buttonColors: [
            "bg-green-500 dark:bg-green-600",
            "bg-green-600 dark:bg-green-500",
            "bg-green-700 dark:bg-green-500",
            "bg-green-700 dark:bg-green-400",
        ],
        buttonHoverColors: [
            "hover:bg-green-600 dark:hover:bg-green-700",
            "hover:bg-green-700 dark:hover:bg-green-600",
            "hover:bg-green-800 dark:hover:bg-green-600",
            "hover:bg-green-800 dark:hover:bg-green-500",
        ],
        ringColors: [
            "ring-2 shadow ring-green-200 dark:ring-green-800",
            "ring-2 shadow ring-green-300 dark:ring-green-700",
            "ring-2 shadow ring-green-400 dark:ring-green-600",
            "ring-2 shadow ring-green-500 dark:ring-green-500",
            "ring-2 shadow ring-green-600 dark:ring-green-400",
            "ring-2 shadow ring-green-700 dark:ring-green-300",
        ],
        ringHoverColors: [
            "hover:ring hover:ring-green-300 dark:hover:ring-green-700",
            "hover:ring hover:ring-green-400 dark:hover:ring-green-600",
            "hover:ring hover:ring-green-500 dark:hover:ring-green-500",
            "hover:ring hover:ring-green-600 dark:hover:ring-green-400",
            "hover:ring hover:ring-green-700 dark:hover:ring-green-300",
            "hover:ring hover:ring-green-800 dark:hover:ring-green-200",
        ],
    },
    high: {
        // Purple family for High School - mature, sophisticated
        bgColors: [
            "bg-purple-50 dark:bg-purple-950/40",
            "bg-purple-100 dark:bg-purple-900/40",
            "bg-purple-200 dark:bg-purple-800/40",
            "bg-purple-300 dark:bg-purple-700/40",
            "bg-purple-400 dark:bg-purple-600/40",
            "bg-purple-500 dark:bg-purple-500/40",
        ],
        iconColors: [
            "text-purple-400 dark:text-purple-500",
            "text-purple-500 dark:text-purple-400",
            "text-purple-600 dark:text-purple-400",
            "text-purple-700 dark:text-purple-300",
            "text-purple-800 dark:text-purple-200",
            "text-purple-900 dark:text-purple-100",
        ],
        buttonColors: [
            "bg-purple-500 dark:bg-purple-600",
            "bg-purple-600 dark:bg-purple-500",
            "bg-purple-700 dark:bg-purple-500",
            "bg-purple-700 dark:bg-purple-400",
            "bg-purple-800 dark:bg-purple-400",
            "bg-purple-800 dark:bg-purple-300",
        ],
        buttonHoverColors: [
            "hover:bg-purple-600 dark:hover:bg-purple-700",
            "hover:bg-purple-700 dark:hover:bg-purple-600",
            "hover:bg-purple-800 dark:hover:bg-purple-600",
            "hover:bg-purple-800 dark:hover:bg-purple-500",
            "hover:bg-purple-900 dark:hover:bg-purple-500",
            "hover:bg-purple-900 dark:hover:bg-purple-400",
        ],
        ringColors: [
            "ring-2 shadow ring-purple-200 dark:ring-purple-800",
            "ring-2 shadow ring-purple-300 dark:ring-purple-700",
            "ring-2 shadow ring-purple-400 dark:ring-purple-600",
            "ring-2 shadow ring-purple-500 dark:ring-purple-500",
            "ring-2 shadow ring-purple-600 dark:ring-purple-400",
            "ring-2 shadow ring-purple-700 dark:ring-purple-300",
        ],
        ringHoverColors: [
            "hover:ring hover:ring-purple-300 dark:hover:ring-purple-700",
            "hover:ring hover:ring-purple-400 dark:hover:ring-purple-600",
            "hover:ring hover:ring-purple-500 dark:hover:ring-purple-500",
            "hover:ring hover:ring-purple-600 dark:hover:ring-purple-400",
            "hover:ring hover:ring-purple-700 dark:hover:ring-purple-300",
            "hover:ring hover:ring-purple-800 dark:hover:ring-purple-200",
        ],
    },
};

/**
 * Gets the color configuration for a class based on its level
 * Automatically detects country from level format and assigns appropriate colors
 */
export function getClassConfig(level: string): ClassConfig {
    const country = detectCountry(level);
    const educationalLevel = getEducationalLevel(level, country);
    const progressionIndex = getProgressionIndex(
        level,
        educationalLevel,
        country
    );
    const colorScheme = EDUCATIONAL_LEVEL_COLORS[educationalLevel];

    // Clamp progression index to available colors
    const index = Math.min(progressionIndex, colorScheme.bgColors.length - 1);

    return {
        icon: GraduationCap,
        bgColor: colorScheme.bgColors[index],
        iconColor: colorScheme.iconColors[index],
        buttonColor: colorScheme.buttonColors[index],
        buttonHoverColor: colorScheme.buttonHoverColors[index],
        ringColor: colorScheme.ringColors?.[index],
        ringHoverColor: colorScheme.ringHoverColors?.[index] ?? "",
    };
}
