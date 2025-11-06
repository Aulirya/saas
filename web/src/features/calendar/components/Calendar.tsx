import { addDays, format } from "date-fns";
import { useState } from "react";
import { WeeklySchedule } from "@/components/journal/weekly_schedule";
import { useCalendar } from "../hooks/useCalendar";
import { useCalendarEvents } from "../api/useCalendarEvents";
import { LessonModal } from "./LessonModal";

export function Calendar() {
    const {
        weekStartDate,
        displayedWeek,
        computeTimeSlotsForWeek,
        goNextWeek,
        goPreviousWeek,
        weekDays,
    } = useCalendar();

    const startISO = format(weekStartDate, "yyyy-MM-dd");
    const endISO = format(addDays(weekStartDate, 6), "yyyy-MM-dd");
    const { data: courses = [] } = useCalendarEvents({ startISO, endISO });

    const timeSlots = computeTimeSlotsForWeek(courses);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState<Date | undefined>();
    const [modalSlot, setModalSlot] = useState<string | undefined>();

    const weekDatesByKey = {
        monday: weekDays[0],
        tuesday: weekDays[1],
        wednesday: weekDays[2],
        thursday: weekDays[3],
        friday: weekDays[4],
    } as const;

    return (
        <>
            <WeeklySchedule
                weekLabel={displayedWeek}
                onPreviousWeek={goPreviousWeek}
                onNextWeek={goNextWeek}
                timeSlots={timeSlots}
                weekDatesByKey={weekDatesByKey}
                onEmptySlotClick={({ date, slotLabel }) => {
                    setModalDate(date);
                    setModalSlot(slotLabel);

                    setModalOpen(true);
                }}
            />
            <LessonModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                initialDate={modalDate}
                initialSlotLabel={modalSlot}
                onSubmit={async (course) => {
                    console.log("new course", course);
                }}
            />
        </>
    );
}
