import React from "react";
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

type CourseBlock = {
    id: string;
    subject: string;
    level: string;
    color: "blue" | "purple" | "green";
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
};

const colorClasses = {
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
    green: "bg-green-500 text-white",
};

const weekdays = [
    { label: "Lun", key: "monday" as const },
    { label: "Mar", key: "tuesday" as const },
    { label: "Mer", key: "wednesday" as const },
    { label: "Jeu", key: "thursday" as const },
    { label: "Ven", key: "friday" as const },
];

export function WeeklySchedule({
    weekLabel,
    onPreviousWeek,
    onNextWeek,
    timeSlots,
}: WeeklyScheduleProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="border-b">
                <CardTitle>Planning de la semaine</CardTitle>
                <CardAction>
                    <div className="flex items-center gap-2">
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
                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-6 gap-2">
                            {/* Header Row */}
                            <div className="sticky left-0 z-10 bg-card px-2 py-3 text-sm font-medium text-muted-foreground">
                                Horaires
                            </div>
                            {weekdays.map((day) => (
                                <div
                                    key={day.key}
                                    className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
                                >
                                    {day.label}
                                </div>
                            ))}

                            {/* Time Slot Rows */}
                            {timeSlots.map((slot) => (
                                <React.Fragment key={slot.time}>
                                    {/* Time Label */}
                                    <div className="sticky left-0 z-10 flex items-center bg-card px-2 py-4 text-sm font-medium text-muted-foreground">
                                        {slot.time}
                                    </div>
                                    {/* Course Blocks */}
                                    {weekdays.map((day) => {
                                        const course = slot.courses[day.key];
                                        return (
                                            <div
                                                key={`${slot.time}-${day.key}`}
                                                className="min-h-[80px] px-2 py-2"
                                            >
                                                {course ? (
                                                    <div
                                                        className={cn(
                                                            "rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md",
                                                            colorClasses[
                                                                course.color
                                                            ]
                                                        )}
                                                    >
                                                        <div className="font-semibold">
                                                            {course.subject}
                                                        </div>
                                                        <div className="mt-1 text-xs opacity-90">
                                                            {course.level}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full rounded-lg border border-dashed border-muted" />
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
