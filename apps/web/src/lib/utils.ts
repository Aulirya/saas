import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Generates a consistent color scheme from a text string using a hash function.
 * Returns Tailwind classes for background and text colors.
 */
// This will be improved later with a more sophisticated color scheme
export function getColorFromText(text: string): {
    bg: string;
    bgLight: string;
    text: string;
    border?: string;
    button?: string;
} {
    // Simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Map hash to color palette (using absolute value)
    const colors = [
        {
            bg: "bg-blue-600",
            bgLight: "bg-blue-50",
            text: "text-blue-600",
            border: "border-blue-200",
            color: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700",
        },
        {
            bg: "bg-green-600",
            bgLight: "bg-green-50",
            text: "text-green-600",
            border: "border-green-200",
            color: "text-green-600",
            button: "bg-green-600 hover:bg-green-700",
        },
        {
            bg: "bg-orange-600",
            bgLight: "bg-orange-50",
            text: "text-orange-600",
            border: "border-orange-200",
            color: "text-orange-600",
            button: "bg-orange-600 hover:bg-orange-700",
        },
        {
            bg: "bg-purple-600",
            bgLight: "bg-purple-50",
            text: "text-purple-600",
            border: "border-purple-200",
            color: "text-purple-600",
            button: "bg-purple-600 hover:bg-purple-700",
        },
        {
            bg: "bg-pink-600",
            bgLight: "bg-pink-50",
            text: "text-pink-600",
            border: "border-pink-200",
            color: "text-pink-600",
            button: "bg-pink-600 hover:bg-pink-700",
        },
        {
            bg: "bg-indigo-600",
            bgLight: "bg-indigo-50",
            text: "text-indigo-600",
            border: "border-indigo-200",
            color: "text-indigo-600",
            button: "bg-indigo-600 hover:bg-indigo-700",
        },
        {
            bg: "bg-teal-600",
            bgLight: "bg-teal-50",
            text: "text-teal-600",
            border: "border-teal-200",
            color: "text-teal-600",
            button: "bg-teal-600 hover:bg-teal-700",
        },
        {
            bg: "bg-cyan-600",
            bgLight: "bg-cyan-50",
            text: "text-cyan-600",
            border: "border-cyan-200",
            color: "text-cyan-600",
            button: "bg-cyan-600 hover:bg-cyan-700",
        },
    ];

    const index = Math.abs(hash) % colors.length;
    return colors[index];
}
