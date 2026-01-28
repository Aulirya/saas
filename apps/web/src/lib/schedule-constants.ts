/**
 * Days of the week constants for schedule configuration
 */
export const DAYS_OF_WEEK = [
    { value: 1, label: "Lundi" },
    { value: 2, label: "Mardi" },
    { value: 3, label: "Mercredi" },
    { value: 4, label: "Jeudi" },
    { value: 5, label: "Vendredi" },
    { value: 6, label: "Samedi" },
    { value: 7, label: "Dimanche" },
] as const;

/**
 * Hour options for schedule configuration (24-hour format)
 * Format: HH:00 (e.g., "08:00", "09:00", "23:00")
 */
export const HOURS: { value: number; label: string }[] = Array.from(
    { length: 24 },
    (_, i) => ({
        value: i,
        label: `${String(i).padStart(2, "0")}:00`,
    })
);

/**
 * Helper function to format an hour number to HH:00 format
 */
export function formatHour(hour: number): string {
    return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Helper function to format a time range (e.g., "08:00 - 09:00")
 */
export function formatTimeRange(startHour: number, endHour: number): string {
    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
}

/**
 * Calculate the duration of a schedule slot in hours
 * @param slot - Object with start_hour and end_hour properties
 * @returns Duration in hours (always >= 0)
 */
export function getSlotDuration(start_hour: number, end_hour: number): number {
    return Math.max(0, end_hour - start_hour);
}
