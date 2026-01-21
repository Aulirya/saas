import { addDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { WeeklySchedule } from "@/components/journal/weekly_schedule";
import { useCalendar } from "../hooks/useCalendar";
import { useCalendarEvents } from "../api/useCalendarEvents";
import { CalendarFormModal } from "./CalendarFormModal";
import type { ScheduledCourse } from "../types";
import { Card } from "@/components/ui/card";

type CalendarProps = {
    initialDate?: Date;
    onWeekChange?: (weekStartDate: Date) => void;
};

export function Calendar({ initialDate, onWeekChange }: CalendarProps) {
    const {
        weekStartDate,
        displayedWeek,
        computeTimeSlotsForWeek,
        goNextWeek,
        goPreviousWeek,
        weekDays,
    } = useCalendar({ date: initialDate });

    useEffect(() => {
        onWeekChange?.(weekStartDate);
    }, [onWeekChange, weekStartDate]);

    const startISO = format(weekStartDate, "yyyy-MM-dd");
    const endISO = format(addDays(weekStartDate, 6), "yyyy-MM-dd");
    const { data: courses = [], isLoading: isLoadingCourses } =
        useCalendarEvents({ startISO, endISO });

    const timeSlots = computeTimeSlotsForWeek(courses);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState<Date | undefined>();
    const [modalSlot, setModalSlot] = useState<string | undefined>();
    const [selectedCourse, setSelectedCourse] = useState<
        ScheduledCourse | undefined
    >();

    const weekDatesByKey = {
        monday: weekDays[0],
        tuesday: weekDays[1],
        wednesday: weekDays[2],
        thursday: weekDays[3],
        friday: weekDays[4],
    } as const;

    function CalendarLoadingOverlay() {
        return (
            <Card className=" bg-white border rounded-xl shadow-xs animate-pulse">
                <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-sm">
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                        <div className="relative h-16 w-16">
                            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-lg" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 border-b-pink-500 animate-spin" />
                            <div className="absolute inset-2 rounded-full bg-white" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
                            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s]" />
                            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-pink-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                            Chargement du calendrier...
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: 7 }).map((_, index) => (
                        <div
                            key={`calendar-skeleton-${index}`}
                            className="h-10 rounded-lg bg-gray-200"
                        />
                    ))}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={`calendar-row-${index}`}
                            className="h-12 rounded-xl bg-gray-200"
                        />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <>
            {isLoadingCourses ? (
                <CalendarLoadingOverlay />
            ) : (
                <>
                    <WeeklySchedule
                        weekLabel={displayedWeek}
                        onPreviousWeek={goPreviousWeek}
                        onNextWeek={goNextWeek}
                        timeSlots={timeSlots}
                        weekDatesByKey={weekDatesByKey}
                        onEmptySlotClick={({ date, slotLabel }) => {
                            setSelectedCourse(undefined);
                            setModalDate(date);
                            setModalSlot(slotLabel);
                            setModalOpen(true);
                        }}
                        onCourseClick={({ id }) => {
                            const found = courses.find((c) => c.id === id);
                            setSelectedCourse(found);
                            // Clear date/slot when editing to rely on selected course values
                            setModalDate(undefined);
                            setModalSlot(undefined);
                            setModalOpen(true);
                        }}
                    />
                    <CalendarFormModal
                        key={`${selectedCourse?.id ?? "new"}-${
                            modalDate?.toISOString() ?? ""
                        }-${modalSlot ?? ""}`}
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                        initialDate={modalDate}
                        initialSlotLabel={modalSlot}
                        initialCourse={selectedCourse}
                        onSubmit={async () => {
                            // Form submission is handled in CalendarFormModal
                        }}
                    />
                </>
            )}
        </>
    );
}
