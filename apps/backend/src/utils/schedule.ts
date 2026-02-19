import type { DateTime } from "surrealdb";
import type { RecurringScheduleSlot } from "shared";

export type RecurringScheduleSlotWithDateTime = Omit<
  RecurringScheduleSlot,
  "start_date"
> & {
  start_date: DateTime;
};

export function timesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
  );
}

export function getDayName(dayOfWeek: number): string {
  const days = [
    "",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];
  return days[dayOfWeek] || "";
}

export function getSlotDuration(startHour: number, endHour: number): number {
  return endHour - startHour;
}

export function getNextOccurrence(startDate: Date, dayOfWeek: number): Date {
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

export function generateScheduleDates(
  recurringSchedule: RecurringScheduleSlotWithDateTime[],
  totalHoursNeeded: number,
): Array<{
  date: Date;
  startHour: number;
  endHour: number;
  slotIndex: number;
}> {
  const scheduleDates: Array<{
    date: Date;
    startHour: number;
    endHour: number;
    slotIndex: number;
  }> = [];

  const sortedSlots = [...recurringSchedule].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week;
    }
    return a.start_hour - b.start_hour;
  });

  let totalHoursScheduled = 0;
  let currentWeek = 0;
  const startDates = sortedSlots.map(
    (slot) => new Date(slot.start_date.toString()),
  );

  while (totalHoursScheduled < totalHoursNeeded) {
    for (let slotIndex = 0; slotIndex < sortedSlots.length; slotIndex++) {
      if (totalHoursScheduled >= totalHoursNeeded) break;

      const slot = sortedSlots[slotIndex];
      const slotStartDate = startDates[slotIndex];
      const slotDuration = getSlotDuration(slot.start_hour, slot.end_hour);

      const firstOccurrence = getNextOccurrence(
        slotStartDate,
        slot.day_of_week,
      );

      const occurrenceDate = new Date(firstOccurrence);
      occurrenceDate.setDate(occurrenceDate.getDate() + currentWeek * 7);

      scheduleDates.push({
        date: occurrenceDate,
        startHour: slot.start_hour,
        endHour: slot.end_hour,
        slotIndex,
      });

      totalHoursScheduled += slotDuration;
    }
    currentWeek++;
  }

  return scheduleDates;
}
