import React from "react";
import {
    addDays,
    endOfMonth,
    endOfWeek,
    format,
    getHours,
    getMinutes,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfWeek,
} from "date-fns";
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
import type { ScheduledCourse } from "@/features/calendar/types";

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
    onTodayClick: () => void;
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
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

type MonthlyScheduleProps = {
    monthLabel: string;
    monthStartDate: Date;
    courses: ScheduledCourse[];
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onTodayClick: () => void;
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
    onCourseClick?: (args: { id: string }) => void;
};

type CalendarView = "week" | "month";

const weekdays = [
    { label: "Lun", key: "monday" as const },
    { label: "Mar", key: "tuesday" as const },
    { label: "Mer", key: "wednesday" as const },
    { label: "Jeu", key: "thursday" as const },
    { label: "Ven", key: "friday" as const },
];
const ROW_HEIGHT_PX = 100;

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

type CalendarHeaderProps = {
    label: string;
    onPrevious: () => void;
    onNext: () => void;
    onTodayClick: () => void;
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
};

const CalendarHeader = React.memo(function CalendarHeader({
    onPrevious,
    onNext,
    onTodayClick,
    view,
    onViewChange,
}: CalendarHeaderProps) {
    return (
        <div className="flex flex-wrap flex-col items-end justify-between gap-2 pb-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-border">
                    <Button
                        size="sm"
                        variant={view === "week" ? "default" : "ghost"}
                        onClick={() => onViewChange("week")}
                    >
                        Semaine
                    </Button>
                    <Button
                        size="sm"
                        variant={view === "month" ? "default" : "ghost"}
                        onClick={() => onViewChange("month")}
                    >
                        Mois
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onPrevious}
                    aria-label="Période précédente"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Précédent</span>
                </Button>

                <Button variant="outline" size="sm" onClick={onTodayClick}>
                    Aujourd'hui
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onNext}
                    aria-label="Période suivante"
                >
                    <span className="hidden sm:inline">Suivant</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
});

type WeeklyCourseBlockProps = {
    course: CourseBlock;
    slotStartHour: number;
    onCourseClick?: (id: string) => void;
};

const WeeklyCourseBlockCard = React.memo(function WeeklyCourseBlockCard({
    course,
    slotStartHour,
    onCourseClick,
}: WeeklyCourseBlockProps) {
    const layout = React.useMemo(() => {
        const startHour = getHourFraction(course.startDateTime);
        const rawEndHour = getHourFraction(course.endDateTime);
        const endHour = rawEndHour <= startHour ? startHour + 1 : rawEndHour;
        const startsInSlot =
            startHour >= slotStartHour && startHour < slotStartHour + 1;

        if (!startsInSlot) {
            return { startsInSlot: false, offsetPx: 0, heightPx: 0 };
        }

        const offsetPx = Math.max(
            0,
            (startHour - slotStartHour) * ROW_HEIGHT_PX
        );
        const heightPx = Math.max(
            32,
            (endHour - startHour) * ROW_HEIGHT_PX +
                (endHour - startHour > 1 ? 5 * (endHour - startHour) : 0)
        );

        return { startsInSlot: true, offsetPx, heightPx };
    }, [course.startDateTime, course.endDateTime, slotStartHour]);

    const config = React.useMemo(
        () => getCategoryConfig(course.subject_category),
        [course.subject_category]
    );
    const courseTime = React.useMemo(
        () => formatCourseTime(course),
        [course.startDateTime, course.endDateTime]
    );
    const handleClick = React.useCallback(
        () => onCourseClick?.(course.id),
        [onCourseClick, course.id]
    );

    if (!layout.startsInSlot) {
        return <div className="h-full w-full" aria-hidden="true" />;
    }

    const Icon = config.icon;

    return (
        <div
            className={cn(
                "absolute left-2 right-2 z-10 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md",
                config.color,
                config.borderColor
            )}
            style={{
                top: `${layout.offsetPx}px`,
                height: `${layout.heightPx}px`,
            }}
            onClick={handleClick}
        >
            <div className="flex items-center justify-between gap-2 text-xs font-normal opacity-90">
                <span>{courseTime}</span>
                <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />
            </div>
            <div className="font-semibold ">{course.subject_name} </div>
            <div className="">{course.lesson_label} </div>
            <div className="mt-1 text-xs opacity-90">{course.class_level}</div>
        </div>
    );
});

type EmptySlotButtonProps = {
    date: Date;
    slotLabel: string;
    onEmptySlotClick?: (args: { date: Date; slotLabel: string }) => void;
};

const EmptySlotButton = React.memo(function EmptySlotButton({
    date,
    slotLabel,
    onEmptySlotClick,
}: EmptySlotButtonProps) {
    const handleClick = React.useCallback(() => {
        onEmptySlotClick?.({ date, slotLabel });
    }, [date, onEmptySlotClick, slotLabel]);

    return (
        <button
            type="button"
            className="h-full w-full rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 transition-colors hover:bg-muted/30 hover:border-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={handleClick}
        />
    );
});

type MonthlyCourseButtonProps = {
    course: ScheduledCourse;
    onCourseClick?: (id: string) => void;
};

const MonthlyCourseButton = React.memo(function MonthlyCourseButton({
    course,
    onCourseClick,
}: MonthlyCourseButtonProps) {
    const config = React.useMemo(
        () => getCategoryConfig(course.subject_category),
        [course.subject_category]
    );
    const handleClick = React.useCallback(
        () => onCourseClick?.(course.id),
        [onCourseClick, course.id]
    );

    return (
        <button
            type="button"
            className={cn(
                "flex w-full items-center justify-between rounded-md border px-2 py-1 text-left text-xs transition hover:shadow-sm",
                config.color,
                config.borderColor
            )}
            onClick={handleClick}
        >
            <span className="truncate">{course.subject_name}</span>
            <span className="ml-2 shrink-0 text-[10px] font-medium">
                {format(parseISO(course.startDateTime), "HH:mm")}
            </span>
        </button>
    );
});

export function WeeklySchedule({
    weekLabel,
    onPreviousWeek,
    onNextWeek,
    onTodayClick,
    view,
    onViewChange,
    timeSlots,
    weekDatesByKey,
    onEmptySlotClick,
    onCourseClick,
}: WeeklyScheduleProps) {
    const dateFormatter = React.useMemo(
        () =>
            new Intl.DateTimeFormat("fr-FR", {
                day: "2-digit",
                month: "2-digit",
            }),
        []
    );
    const today = React.useMemo(() => new Date(), [weekLabel]);
    const weekHeaderDays = React.useMemo(
        () =>
            weekdays.map((day) => {
                const date = weekDatesByKey?.[day.key];
                return {
                    ...day,
                    date,
                    isToday: date ? isSameDay(date, today) : false,
                    formattedDate: dateFormatter.format(date || today),
                };
            }),
        [dateFormatter, today, weekDatesByKey]
    );
    const handleCourseClick = React.useCallback(
        (id: string) => onCourseClick?.({ id }),
        [onCourseClick]
    );

    return (
        <Card className="flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="capitalize text-2xl">
                    {weekLabel}
                </CardTitle>

                <CardAction>
                    <CalendarHeader
                        label={weekLabel}
                        onPrevious={onPreviousWeek}
                        onNext={onNextWeek}
                        onTodayClick={onTodayClick}
                        view={view}
                        onViewChange={onViewChange}
                    />
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pt-4">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-[3rem_repeat(5,1fr)] gap-2">
                            {/* Header Row */}
                            <div className="sticky left-0 z-10 w-12 min-w-12 bg-card px-2 py-3 text-sm font-medium text-muted-foreground "></div>
                            {weekHeaderDays.map((day) => (
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
                                                day.isToday
                                                    ? "bg-primary/10 rounded px-1 font-semibold text-primary"
                                                    : undefined
                                            )}
                                        >
                                            {day.formattedDate}
                                        </span>
                                    </span>
                                </div>
                            ))}

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
                                                    <WeeklyCourseBlockCard
                                                        course={course}
                                                        slotStartHour={
                                                            slotStartHour
                                                        }
                                                        onCourseClick={
                                                            handleCourseClick
                                                        }
                                                    />
                                                ) : (
                                                    <EmptySlotButton
                                                        date={
                                                            weekDatesByKey?.[
                                                                day.key
                                                            ] || today
                                                        }
                                                        slotLabel={slot.time}
                                                        onEmptySlotClick={
                                                            onEmptySlotClick
                                                        }
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

export function MonthlySchedule({
    monthLabel,
    monthStartDate,
    courses,
    onPreviousMonth,
    onNextMonth,
    onTodayClick,
    view,
    onViewChange,
    onCourseClick,
}: MonthlyScheduleProps) {
    const weekdaysHeader = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const gridStart = React.useMemo(
        () =>
            startOfWeek(startOfMonth(monthStartDate), {
                weekStartsOn: 1,
            }),
        [monthStartDate]
    );
    const gridEnd = React.useMemo(
        () =>
            endOfWeek(endOfMonth(monthStartDate), {
                weekStartsOn: 1,
            }),
        [monthStartDate]
    );
    const days = React.useMemo(() => {
        const result: Date[] = [];
        for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
            result.push(d);
        }
        return result;
    }, [gridEnd, gridStart]);
    const today = React.useMemo(() => new Date(), [monthLabel]);
    const handleCourseClick = React.useCallback(
        (id: string) => onCourseClick?.({ id }),
        [onCourseClick]
    );

    const coursesByDay = React.useMemo(() => {
        const map = new Map<string, ScheduledCourse[]>();
        courses.forEach((course) => {
            const date = parseISO(course.startDateTime);
            const key = format(date, "yyyy-MM-dd");
            const existing = map.get(key) ?? [];
            existing.push(course);
            map.set(key, existing);
        });
        map.forEach((value) => {
            value.sort((a, b) =>
                a.startDateTime.localeCompare(b.startDateTime)
            );
        });
        return map;
    }, [courses]);

    return (
        <Card className="flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="capitalize text-2xl">
                    {" "}
                    {monthLabel}
                </CardTitle>
                <CardAction>
                    <CalendarHeader
                        label={monthLabel}
                        onPrevious={onPreviousMonth}
                        onNext={onNextMonth}
                        onTodayClick={onTodayClick}
                        view={view}
                        onViewChange={onViewChange}
                    />
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pt-4">
                    <div className="min-w-[700px]">
                        <div className="grid grid-cols-7 gap-2 text-sm font-medium text-muted-foreground">
                            {weekdaysHeader.map((day) => (
                                <div
                                    key={day}
                                    className="px-2 py-2 text-center"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-2">
                            {days.map((date) => {
                                const isToday = isSameDay(date, today);
                                const isCurrentMonth = isSameMonth(
                                    date,
                                    monthStartDate
                                );
                                const dayKey = format(date, "yyyy-MM-dd");
                                const dayCourses =
                                    coursesByDay.get(dayKey) ?? [];
                                const visibleCourses = dayCourses.slice(0, 2);
                                const remaining =
                                    dayCourses.length - visibleCourses.length;

                                return (
                                    <div
                                        key={dayKey}
                                        className={cn(
                                            "min-h-[120px] rounded-lg border bg-background p-2 text-sm",
                                            !isCurrentMonth &&
                                                "bg-muted/40 text-muted-foreground",
                                            isToday &&
                                                "border-primary/60 shadow-[0_0_0_1px_rgba(99,102,241,0.4)]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold">
                                                {format(date, "d")}
                                            </span>
                                            {isToday ? (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                    Aujourd'hui
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {visibleCourses.map((course) => (
                                                <MonthlyCourseButton
                                                    key={course.id}
                                                    course={course}
                                                    onCourseClick={
                                                        handleCourseClick
                                                    }
                                                />
                                            ))}
                                            {remaining > 0 ? (
                                                <div className="text-xs text-muted-foreground">
                                                    +{remaining} autres
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
