import React from "react";
import { format, getHours, getMinutes, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardAction,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCategoryConfig } from "@/lib/subject-utils";

type CourseBlock = {
    id: string;
    subject_name: string;
    subject_category: string;
    class_name: string;
    class_level: string;
    lesson_label: string;
    level: string;
    color: "blue" | "purple" | "green";
    startDateTime: string;
    endDateTime: string;
};

type TimeSlot = {
    time: string;
    courses: {
        monday?: CourseBlock;
        tuesday?: CourseBlock;
        wednesday?: CourseBlock;
        thursday?: CourseBlock;
        friday?: CourseBlock;
    };
};

type WeeklyScheduleProps = {
    weekLabel: string;
    onPreviousWeek: () => void;
    onNextWeek: () => void;
    timeSlots: TimeSlot[];
    weekDatesByKey?: {
        monday: Date;
        tuesday: Date;
        wednesday: Date;
        thursday: Date;
        friday: Date;
    };
    onEmptySlotClick?: (args: { date: Date; slotLabel: string }) => void;
    onCourseClick?: (args: { id: string }) => void;
};

const weekdays = [
    { label: "Lun", key: "monday" as const },
    { label: "Mar", key: "tuesday" as const },
    { label: "Mer", key: "wednesday" as const },
    { label: "Jeu", key: "thursday" as const },
    { label: "Ven", key: "friday" as const },
];
const ROW_HEIGHT_PX = 100;

export function WeeklySchedule({
    weekLabel,
    onPreviousWeek,
    onNextWeek,
    timeSlots,
    weekDatesByKey,
    onEmptySlotClick,
    onCourseClick,
}: WeeklyScheduleProps) {
    const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
    });

    const formatCourseTime = (course: CourseBlock) => {
        try {
            const start = parseISO(course.startDateTime);
            const end = parseISO(course.endDateTime);
            return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
        } catch {
            return "";
        }
    };

    const getHourFraction = (dateTime: string) => {
        const date = parseISO(dateTime);
        return getHours(date) + getMinutes(date) / 60;
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="border-b">
                <CardTitle>Planning de la semaine</CardTitle>
                <CardAction>
                    <div className="flex items-center gap-2 pb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPreviousWeek}
                            aria-label="Semaine précédente"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Précédent</span>
                        </Button>
                        <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                            {weekLabel}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNextWeek}
                            aria-label="Semaine suivante"
                        >
                            <span className="hidden sm:inline">Suivant</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pt-4">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-[3rem_repeat(5,1fr)] gap-2">
                            {/* Header Row */}
                            <div className="sticky left-0 z-10 w-12 min-w-12 bg-card px-2 py-3 text-sm font-medium text-muted-foreground "></div>
                            {weekdays.map((day) => {
                                const date = weekDatesByKey?.[day.key];
                                const isToday =
                                    date && isSameDay(date, new Date());

                                return (
                                    <div
                                        key={day.key}
                                        className={cn(
                                            "px-2 py-3 text-center text-sm font-medium text-muted-foreground"
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {day.label}.{" "}
                                            <span
                                                className={cn(
                                                    isToday
                                                        ? "bg-primary/10 rounded px-1 font-semibold text-primary"
                                                        : undefined
                                                )}
                                            >
                                                {dateFormatter.format(
                                                    date || new Date()
                                                )}
                                            </span>
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Time Slot Rows */}
                            {timeSlots.map((slot) => (
                                <React.Fragment key={slot.time}>
                                    {/* Time Label */}
                                    <div className="sticky left-0 z-10 flex w-12 min-w-12  px-2 text-sm font-medium text-muted-foreground">
                                        {slot.time}
                                    </div>
                                    {/* Course Blocks */}
                                    {weekdays.map((day) => {
                                        const course = slot.courses[day.key];
                                        const slotStartHour = parseInt(
                                            slot.time,
                                            10
                                        );

                                        return (
                                            <div
                                                key={`${slot.time}-${day.key}`}
                                                className="relative min-h-[100px] px-2"
                                            >
                                                {course ? (
                                                    (() => {
                                                        const startHour =
                                                            getHourFraction(
                                                                course.startDateTime
                                                            );
                                                        const rawEndHour =
                                                            getHourFraction(
                                                                course.endDateTime
                                                            );
                                                        const endHour =
                                                            rawEndHour <=
                                                            startHour
                                                                ? startHour + 1
                                                                : rawEndHour;
                                                        const startsInSlot =
                                                            startHour >=
                                                                slotStartHour &&
                                                            startHour <
                                                                slotStartHour +
                                                                    1;

                                                        if (!startsInSlot) {
                                                            return (
                                                                <div
                                                                    className="h-full w-full"
                                                                    aria-hidden="true"
                                                                />
                                                            );
                                                        }

                                                        const offsetPx =
                                                            Math.max(
                                                                0,
                                                                (startHour -
                                                                    slotStartHour) *
                                                                    ROW_HEIGHT_PX
                                                            );
                                                        const heightPx =
                                                            Math.max(
                                                                32,
                                                                (endHour -
                                                                    startHour) *
                                                                    ROW_HEIGHT_PX +
                                                                    (endHour -
                                                                        startHour >
                                                                    1
                                                                        ? 5 *
                                                                          (endHour -
                                                                              startHour)
                                                                        : 0)
                                                            );

                                                        return (
                                                            <div
                                                                className={cn(
                                                                    "absolute left-2 right-2 z-10 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md",
                                                                    getCategoryConfig(
                                                                        course.subject_category
                                                                    ).color,
                                                                    getCategoryConfig(
                                                                        course.subject_category
                                                                    )
                                                                        .borderColor
                                                                )}
                                                                style={{
                                                                    top: `${offsetPx}px`,
                                                                    height: `${heightPx}px`,
                                                                }}
                                                                onClick={() =>
                                                                    onCourseClick?.(
                                                                        {
                                                                            id: course.id,
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-center justify-between gap-2 text-xs font-normal opacity-90">
                                                                    <span>
                                                                        {formatCourseTime(
                                                                            course
                                                                        )}
                                                                    </span>
                                                                    {(() => {
                                                                        const config =
                                                                            getCategoryConfig(
                                                                                course.subject_category
                                                                            );
                                                                        const Icon =
                                                                            config.icon;
                                                                        return (
                                                                            <Icon
                                                                                className={cn(
                                                                                    "h-3.5 w-3.5",
                                                                                    config.iconColor
                                                                                )}
                                                                            />
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className="font-semibold ">
                                                                    {
                                                                        course.subject_name
                                                                    }{" "}
                                                                </div>
                                                                <div className="">
                                                                    {
                                                                        course.lesson_label
                                                                    }{" "}
                                                                </div>
                                                                <div className="mt-1 text-xs opacity-90">
                                                                    {
                                                                        course.class_level
                                                                    }
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="h-full w-full rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 transition-colors hover:bg-muted/30 hover:border-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                                        onClick={() => {
                                                            const date =
                                                                weekDatesByKey?.[
                                                                    day.key
                                                                ] || new Date();
                                                            onEmptySlotClick?.({
                                                                date,
                                                                slotLabel:
                                                                    slot.time,
                                                            });
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
