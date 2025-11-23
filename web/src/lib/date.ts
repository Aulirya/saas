/**
 * Parses a date string into a Date object, or returns null if invalid
 */
export function parseDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date to a French locale date string (e.g., "lundi 15 janvier")
 */
export function formatDate(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

/**
 * Formats a date to a French locale time string (e.g., "14:30")
 */
export function formatTime(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Formats a time range from start to end date
 * Returns "HH:mm - HH:mm" if both dates exist, or "HH:mm" if only start exists
 */
export function formatTimeRange(
    startDate: Date | null,
    endDate: Date | null
): string {
    if (startDate && endDate) {
        return `${formatTime(startDate)} - ${formatTime(endDate)}`;
    }
    if (startDate) {
        return formatTime(startDate);
    }
    return "";
}

/**
 * Formats a lesson's date and time information
 * Returns an object with formatted date and time strings
 */
export function formatLessonDateTime(
    startAt?: string | null,
    endAt?: string | null
) {
    const startDate = parseDate(startAt);
    const endDate = parseDate(endAt);

    return {
        dateStr: formatDate(startDate),
        timeStr: formatTimeRange(startDate, endDate),
        startDate,
        endDate,
    };
}
