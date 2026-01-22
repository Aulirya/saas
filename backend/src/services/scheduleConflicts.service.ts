import { DateTime, RecordId, surql, Surreal } from "surrealdb";
import type { RecurringScheduleSlot } from "@saas/shared";
import {
    getDayName,
    RecurringScheduleSlotWithDateTime,
    timesOverlap,
} from "../utils/schedule";
import { verifyCourseProgressOwnership } from "../utils/course_progress";

export async function checkScheduleConflictsForInput(params: {
    db: Surreal;
    userId: RecordId;
    courseProgressId: RecordId;
    recurringSchedule: RecurringScheduleSlot[];
}): Promise<
    Array<{
        conflict: boolean;
        message: string;
        slot: RecurringScheduleSlotWithDateTime;
        conflicting_course_progress_id?: string;
    }>
> {
    await verifyCourseProgressOwnership(
        params.db,
        params.courseProgressId,
        params.userId
    );
    const scheduleSlots: RecurringScheduleSlotWithDateTime[] =
        params.recurringSchedule.map((slot) => ({
            day_of_week: slot.day_of_week,
            start_hour: slot.start_hour,
            end_hour: slot.end_hour,
            start_date: new DateTime(slot.start_date),
        }));

    return checkScheduleConflicts(
        params.db,
        params.userId,
        params.courseProgressId,
        scheduleSlots
    );
}

export async function checkScheduleConflicts(
    db: Surreal,
    userId: RecordId,
    courseProgressId: RecordId,
    recurringSchedule: RecurringScheduleSlotWithDateTime[]
): Promise<
    Array<{
        conflict: boolean;
        message: string;
        slot: RecurringScheduleSlotWithDateTime;
        conflicting_course_progress_id?: string;
    }>
> {
    const conflicts: Array<{
        conflict: boolean;
        message: string;
        slot: RecurringScheduleSlotWithDateTime;
        conflicting_course_progress_id?: string;
    }> = [];

    for (let i = 0; i < recurringSchedule.length; i++) {
        for (let j = i + 1; j < recurringSchedule.length; j++) {
            const slot1 = recurringSchedule[i];
            const slot2 = recurringSchedule[j];

            if (
                slot1.day_of_week === slot2.day_of_week &&
                timesOverlap(
                    slot1.start_hour,
                    slot1.end_hour,
                    slot2.start_hour,
                    slot2.end_hour
                )
            ) {
                conflicts.push({
                    conflict: true,
                    message: `Conflit interne: deux créneaux se chevauchent le ${getDayName(
                        slot1.day_of_week
                    ).toLowerCase()} (${slot1.start_hour}h-${slot1.end_hour}h)`,
                    slot: slot1,
                });
            }
        }
    }

    try {
        const allCourseProgressQuery = surql`
            SELECT
                id,
                recurring_schedule,
                subject_id
            FROM course_progress
            WHERE user_id = ${userId}
            AND id != ${courseProgressId}
        `;
        const allCourseProgressResult = await db
            .query<
                [
                    Array<{
                        id: RecordId;
                        subject_id: RecordId;
                        recurring_schedule?: RecurringScheduleSlotWithDateTime[];
                    }>
                ]
            >(allCourseProgressQuery)
            .collect();

        const allCourseProgress = allCourseProgressResult[0] || [];

        const subjectIds = [
            ...new Set(
                allCourseProgress
                    .map((cp) => cp.subject_id)
                    .filter((id) => id !== undefined) as RecordId[]
            ),
        ];

        const subjectNamesMap = new Map<string, string>();
        if (subjectIds.length > 0) {
            for (const subjectId of subjectIds) {
                const subjectQuery = surql`
                    SELECT id, name FROM subjects
                    WHERE id = ${subjectId}
                    AND user_id = ${userId}
                `;
                const subjectResult = await db
                    .query<
                        [
                            Array<{
                                id: string;
                                name: string;
                            }>
                        ]
                    >(subjectQuery)
                    .collect();

                const subjects = subjectResult[0] || [];
                if (subjects.length > 0) {
                    subjectNamesMap.set(
                        subjects[0].id.toString(),
                        subjects[0].name
                    );
                }
            }
        }

        for (const newSlot of recurringSchedule) {
            for (const otherCp of allCourseProgress) {
                const otherSchedules = otherCp.recurring_schedule || [];

                const subjectName =
                    subjectNamesMap.get(otherCp.subject_id.toString()) ||
                    "cours inconnu";

                for (const existingSlot of otherSchedules) {
                    if (
                        existingSlot.day_of_week === newSlot.day_of_week &&
                        timesOverlap(
                            newSlot.start_hour,
                            newSlot.end_hour,
                            existingSlot.start_hour,
                            existingSlot.end_hour
                        )
                    ) {
                        conflicts.push({
                            conflict: true,
                            message: `Conflit avec le cours "${subjectName}" le ${getDayName(
                                newSlot.day_of_week
                            )} de ${existingSlot.start_hour}h à ${
                                existingSlot.end_hour
                            }h`,
                            slot: newSlot,
                            conflicting_course_progress_id:
                                otherCp.id.toString(),
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error(
            "Erreur lors de la récupération/créneau des autres cours :",
            err
        );
    }

    return conflicts;
}
