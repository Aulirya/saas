import type { Lesson } from "../entity/lesson";

export type RecurringScheduleSlot = {
    day_of_week: number;
    start_hour: number;
    end_hour: number;
    start_date: string;
};

export type SchedulePreviewResult = {
    total_lessons: number;
    total_hours: number;
    weeks_needed: number;
    schedule_preview: Array<{
        lesson_label: string;
        scheduled_date: string;
        slot: string;
        duration_hours: number;
    }>;
    warnings: Array<{ lesson_id: string; message: string }>;
};

// Helper function to get next occurrence of a day of week from a start date
function getNextOccurrence(startDate: Date, dayOfWeek: number): Date {
    const date = new Date(startDate);
    const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to our format (1 = Monday, 7 = Sunday)
    const currentDayOfWeek = currentDay === 0 ? 7 : currentDay;

    let daysToAdd = dayOfWeek - currentDayOfWeek;
    if (daysToAdd < 0) {
        daysToAdd += 7;
    }
    if (daysToAdd === 0 && date <= new Date()) {
        daysToAdd = 7; // If today is the day but time has passed, go to next week
    }

    date.setDate(date.getDate() + daysToAdd);
    return date;
}

// Helper function to calculate slot duration in hours
function getSlotDuration(start_hour: number, end_hour: number): number {
    return end_hour - start_hour;
}

// Helper function to generate dates for lessons based on recurring schedule
function generateScheduleDates(
    recurringSchedule: RecurringScheduleSlot[],
    totalHoursNeeded: number
): Array<{
    date: Date;
    start_hour: number;
    end_hour: number;
    slotIndex: number;
}> {
    const scheduleDates: Array<{
        date: Date;
        start_hour: number;
        end_hour: number;
        slotIndex: number;
    }> = [];

    // Sort slots by day of week and start hour
    const sortedSlots = [...recurringSchedule].sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week;
        }
        return a.start_hour - b.start_hour;
    });

    let totalHoursScheduled = 0;
    let currentWeek = 0;
    const startDates = sortedSlots.map((slot) => new Date(slot.start_date));

    while (totalHoursScheduled < totalHoursNeeded) {
        for (let slotIndex = 0; slotIndex < sortedSlots.length; slotIndex++) {
            if (totalHoursScheduled >= totalHoursNeeded) break;

            const slot = sortedSlots[slotIndex];
            const slotStartDate = startDates[slotIndex];
            const slotDuration = getSlotDuration(
                slot?.start_hour ?? 0,
                slot?.end_hour ?? 0
            );

            // Calculate the date for this occurrence
            // First, get the first occurrence of this day of week
            const firstOccurrence = getNextOccurrence(
                slotStartDate ?? new Date(),
                slot?.day_of_week ?? 0
            );

            // Then add the appropriate number of weeks
            const occurrenceDate = new Date(firstOccurrence);
            occurrenceDate.setDate(occurrenceDate.getDate() + currentWeek * 7);

            scheduleDates.push({
                date: occurrenceDate,
                start_hour: slot?.start_hour ?? 0,
                end_hour: slot?.end_hour ?? 0,
                slotIndex,
            });

            totalHoursScheduled += slotDuration;
        }
        currentWeek++;
    }

    return scheduleDates;
}

/**
 * Calculate schedule preview based on lessons and recurring schedule
 * This is a pure function that can be used both client-side and server-side
 */
export function calculateSchedulePreview(
    lessons: Lesson[],
    recurringSchedule: RecurringScheduleSlot[]
): SchedulePreviewResult {
    if (recurringSchedule.length === 0) {
        return {
            total_lessons: lessons.length,
            total_hours: 0,
            weeks_needed: 0,
            schedule_preview: [],
            warnings: [],
        };
    }

    // Sort lessons by order
    const sortedLessons = [...lessons].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
    });

    // Calculate total hours needed
    const totalHoursNeeded = sortedLessons.reduce((sum, lesson) => {
        return sum + (lesson.duration || 60) / 60; // Convert minutes to hours
    }, 0);

    // Generate schedule dates
    const scheduleDates = generateScheduleDates(
        recurringSchedule,
        totalHoursNeeded
    );

    // This will hold each lesson preview
    const preview: Array<{
        lesson_label: string;
        scheduled_date: string;
        slot: string;
        duration_hours: number;
    }> = [];

    // Collects warnings
    const warnings: Array<{ lesson_id: string; message: string }> = [];
    let scheduleIndex = 0;
    let lessonIndex = 0;

    // Track remaining hours for each lesson (for splitting)
    const lessonRemainingHours = sortedLessons.map(
        (lesson) => (lesson.duration || 60) / 60
    );

    // Process slots and fill them with lessons
    while (
        scheduleIndex < scheduleDates.length &&
        lessonIndex < sortedLessons.length
    ) {
        const currentSlot = scheduleDates[scheduleIndex];
        const slotDuration = getSlotDuration(
            currentSlot?.start_hour ?? 0,
            currentSlot?.end_hour ?? 0
        );
        let slotRemainingHours = slotDuration;

        // Fill the current slot with as many lessons as possible
        while (slotRemainingHours > 0 && lessonIndex < sortedLessons.length) {
            const lesson = sortedLessons[lessonIndex];
            const remainingHours = lessonRemainingHours[lessonIndex];

            // Check if lesson fits in remaining slot space
            if (remainingHours <= slotRemainingHours) {
                // Lesson fits completely in the slot
                const scheduledDate = new Date(currentSlot?.date ?? new Date());
                scheduledDate.setHours(currentSlot?.start_hour ?? 0, 0, 0, 0);

                preview.push({
                    lesson_label: lesson?.label ?? "",
                    scheduled_date: scheduledDate.toISOString(),
                    slot: `${currentSlot?.start_hour ?? 0}h-${
                        currentSlot?.end_hour ?? 0
                    }h`,
                    duration_hours: remainingHours ?? 0,
                });

                slotRemainingHours -= remainingHours ?? 0;
                lessonRemainingHours[lessonIndex ?? 0] = 0;
                lessonIndex++;
            } else {
                // Lesson is too long for remaining slot space - split it
                const hoursToSchedule = slotRemainingHours;
                const scheduledDate = new Date(currentSlot?.date ?? new Date());
                scheduledDate.setHours(currentSlot?.start_hour ?? 0, 0, 0, 0);

                preview.push({
                    lesson_label: lesson?.label ?? "",
                    scheduled_date: scheduledDate.toISOString(),
                    slot: `${currentSlot?.start_hour ?? 0}h-${
                        currentSlot?.end_hour ?? 0
                    }h`,
                    duration_hours: hoursToSchedule,
                });

                lessonRemainingHours[lessonIndex ?? 0] -= hoursToSchedule ?? 0;
                slotRemainingHours = 0;

                if (lessonRemainingHours[lessonIndex ?? 0] > 0) {
                    warnings.push({
                        lesson_id: lesson?.id ?? "",
                        message: `La leçon sera répartie sur plusieurs créneaux`,
                    });
                } else {
                    lessonIndex++;
                }
            }
        }

        // Move to next slot if current slot is full
        scheduleIndex++;
    }

    // Check if there are remaining lessons that couldn't be scheduled
    while (lessonIndex < sortedLessons.length) {
        const lesson = sortedLessons[lessonIndex];
        warnings.push({
            lesson_id: lesson?.id ?? "",
            message: "Pas assez de créneaux disponibles",
        });
        lessonIndex++;
    }

    // Calculate weeks needed for the entire schedule
    const lastDate = scheduleDates[scheduleDates.length - 1]?.date;
    const firstDate = scheduleDates[0]?.date;
    const weeksNeeded =
        lastDate && firstDate
            ? Math.floor(
                  (lastDate.getTime() - firstDate.getTime()) /
                      (1000 * 60 * 60 * 24 * 7)
              ) + 1
            : 0;

    return {
        total_lessons: sortedLessons.length,
        total_hours: totalHoursNeeded,
        weeks_needed: weeksNeeded,
        schedule_preview: preview,
        warnings,
    };
}
