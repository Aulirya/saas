import { createFileRoute } from "@tanstack/react-router";
import { StatisticsCard } from "@/components/journal/statistics_card";
import { Calendar } from "@/features/calendar/components/Calendar";
import {
    BookOpenCheck,
    ClockIcon,
    FileUpIcon,
    SparklesIcon,
} from "lucide-react";
import { useDashboardStatistics } from "@/features/courses/api/useDashboardStatistics";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function DashboardPage() {
    const { data: statistics, isLoading } = useDashboardStatistics();

    // Format planned time as hours and minutes
    const formatPlannedTime = (minutes: number): string => {
        if (minutes === 0) return "0min";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    };

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 ">
                        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                            <StatisticsCard
                                description="Cours cette semaine"
                                data={
                                    isLoading
                                        ? "..."
                                        : statistics?.lessonsThisWeek ?? 0
                                }
                                icon={BookOpenCheck}
                            />
                            <StatisticsCard
                                description="Temps planifié"
                                data={
                                    isLoading
                                        ? "..."
                                        : formatPlannedTime(
                                              statistics?.plannedTimeMinutes ??
                                                  0
                                          )
                                }
                                icon={ClockIcon}
                                iconBg="bg-green-100"
                                iconColor="text-green-600"
                            />
                            <StatisticsCard
                                description="Supports disponibles"
                                data={
                                    isLoading
                                        ? "..."
                                        : statistics?.availableResources ?? 0
                                }
                                icon={FileUpIcon}
                                iconBg="bg-purple-100"
                                iconColor="text-purple-600"
                            />
                            <StatisticsCard
                                description="Suggestions IA"
                                data={
                                    isLoading
                                        ? "..."
                                        : statistics?.aiSuggestions ?? 0
                                }
                                icon={SparklesIcon}
                                iconBg="bg-yellow-100"
                                iconColor="text-yellow-600"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1  gap-6 w-full">
                <div className="md:col-span-2">
                    <Calendar />
                </div>
                <div className="hidden md:col-span-1 bg-white rounded-xl border shadow-xs p-6 flex flex-col">
                    {/* Sidebar 1/3 content */}
                    <span className="font-semibold text-lg text-gray-700">
                        Sidebar (1/3 sur desktop)
                    </span>
                    <div className="mt-4 text-gray-500">
                        Ajoutez ici un résumé, profil ou autre.
                    </div>
                </div>
            </div>
        </>
    );
}
