import { useMemo, useState } from "react";
import { startOfWeek, addDays, format } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import { StatisticsCard } from "@/components/journal/statistics_card";
import { WeeklySchedule } from "@/components/journal/weekly_schedule";
import {
    BookOpenCheck,
    ClockIcon,
    FileUpIcon,
    SparklesIcon,
} from "lucide-react";
export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

// Example data matching the image description
const exampleTimeSlots = [
    {
        time: "8h-10h",
        courses: {
            monday: {
                id: "1",
                subject: "Math Terminale S",
                level: "Terminale S",
                color: "blue" as const,
            },
            tuesday: {
                id: "2",
                subject: "Math 1ère S",
                level: "1ère S",
                color: "blue" as const,
            },
            wednesday: {
                id: "3",
                subject: "Chimie Terminale S",
                level: "Terminale S",
                color: "purple" as const,
            },
            thursday: {
                id: "4",
                subject: "Math 2nde",
                level: "2nde",
                color: "blue" as const,
            },
        },
    },
    {
        time: "10h-12h",
        courses: {
            monday: {
                id: "5",
                subject: "Chimie 1ère S",
                level: "1ère S",
                color: "purple" as const,
            },
            tuesday: {
                id: "6",
                subject: "Physique 2nde",
                level: "2nde",
                color: "green" as const,
            },
            thursday: {
                id: "7",
                subject: "Physique 1ère S",
                level: "1ère S",
                color: "green" as const,
            },
        },
    },
    {
        time: "14h-16h",
        courses: {
            monday: {
                id: "8",
                subject: "Physique Terminale S",
                level: "Terminale S",
                color: "green" as const,
            },
            wednesday: {
                id: "9",
                subject: "Math Terminale S",
                level: "Terminale S",
                color: "blue" as const,
            },
            friday: {
                id: "10",
                subject: "Physique 2nde",
                level: "2nde",
                color: "green" as const,
            },
        },
    },
];

// Reusable date helpers
function getWeekdays(date: Date) {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
}

function formatWeekRangeLabel(weekStart: Date) {
    const weekdays = getWeekdays(weekStart);
    const start = weekdays[0];
    const end = weekdays[4];
    const startDay = format(start, "d");
    const endDay = format(end, "d");
    const sameMonth = format(start, "MMM yyyy") === format(end, "MMM yyyy");
    const startMonth = format(start, "MMM");
    const endMonth = format(end, "MMM");
    const year = format(end, "yyyy");
    return sameMonth
        ? `${startDay}-${endDay} ${endMonth} ${year}`
        : `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

function DashboardPage() {
    const today = new Date();
    const [weekStartDate, setWeekStartDate] = useState<Date>(
        startOfWeek(today, { weekStartsOn: 1 })
    );

    const displayedWeek = useMemo(
        () => formatWeekRangeLabel(weekStartDate),
        [weekStartDate]
    );

    const handlePreviousWeek = () => {
        setWeekStartDate((prev) => addDays(prev, -7));
    };

    const handleNextWeek = () => {
        setWeekStartDate((prev) => addDays(prev, 7));
    };
    return (
        <div>
            <div className="flex flex-1 flex-col h-full">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                            <StatisticsCard
                                description="Cours cette semaine"
                                data={"$1,250.00"}
                                icon={BookOpenCheck}
                            />
                            <StatisticsCard
                                description="Temps planifié"
                                data={"$1,250.00"}
                                icon={ClockIcon}
                                iconBg="bg-green-100"
                                iconColor="text-green-600"
                            />
                            <StatisticsCard
                                description="Supports disponibles"
                                data={"$1,250.00"}
                                icon={FileUpIcon}
                                iconBg="bg-purple-100"
                                iconColor="text-purple-600"
                            />
                            <StatisticsCard
                                description="Suggestions IA"
                                data={"$1,250.00"}
                                icon={SparklesIcon}
                                iconBg="bg-yellow-100"
                                iconColor="text-yellow-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 lg:px-6 pb-6 w-full">
                <div className="md:col-span-2">
                    <WeeklySchedule
                        weekLabel={displayedWeek}
                        onPreviousWeek={handlePreviousWeek}
                        onNextWeek={handleNextWeek}
                        timeSlots={exampleTimeSlots}
                    />
                </div>
                <div className="md:col-span-1 bg-white rounded-xl border shadow-xs p-6 flex flex-col">
                    {/* Sidebar 1/3 content */}
                    <span className="font-semibold text-lg text-gray-700">
                        Sidebar (1/3 sur desktop)
                    </span>
                    <div className="mt-4 text-gray-500">
                        Ajoutez ici un résumé, profil ou autre.
                    </div>
                </div>
            </div>
        </div>
    );
}
