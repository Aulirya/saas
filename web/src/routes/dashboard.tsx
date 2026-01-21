import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatisticsCard } from "@/components/journal/statistics_card";
import { Calendar } from "@/features/calendar/components/Calendar";
import {
    BookOpenCheck,
    ClockIcon,
    FileUpIcon,
    SparklesIcon,
} from "lucide-react";
import { useDashboardStatistics } from "@/features/courses/api/useDashboardStatistics";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard")({
    component: DashboardPage,
});

function LoadingStatCard() {
    return (
        <div
            data-slot="card"
            className="bg-white border rounded-xl shadow-xs p-6 animate-pulse"
        >
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex flex-col gap-2 w-full">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-6 w-1/3 rounded bg-gray-200" />
                </div>
            </div>
        </div>
    );
}

function DashboardPage() {
    const { data: statistics, isLoading } = useDashboardStatistics();
    const [activeModal, setActiveModal] = useState<"resources" | "ai" | null>(
        null
    );

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
            <DashboardInsightsDialog
                activeModal={activeModal}
                onOpenChange={(open) => {
                    if (!open) setActiveModal(null);
                }}
            />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 ">
                        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                            {isLoading ? (
                                <>
                                    <LoadingStatCard />
                                    <LoadingStatCard />
                                    <LoadingStatCard />
                                    <LoadingStatCard />
                                </>
                            ) : (
                                <>
                                    <StatisticsCard
                                        description="Cours cette semaine"
                                        data={statistics?.lessonsThisWeek ?? 0}
                                        icon={BookOpenCheck}
                                    />
                                    <StatisticsCard
                                        description="Temps planifié"
                                        data={formatPlannedTime(
                                            statistics?.plannedTimeMinutes ?? 0
                                        )}
                                        icon={ClockIcon}
                                        iconBg="bg-green-100"
                                        iconColor="text-green-600"
                                    />
                                    <StatisticsCard
                                        description="Supports disponibles"
                                        data={
                                            statistics?.availableResources ?? 0
                                        }
                                        icon={FileUpIcon}
                                        iconBg="bg-purple-100"
                                        iconColor="text-purple-600"
                                        onClick={() =>
                                            setActiveModal("resources")
                                        }
                                    />
                                    <StatisticsCard
                                        description="Suggestions IA"
                                        data={statistics?.aiSuggestions ?? 0}
                                        icon={SparklesIcon}
                                        iconBg="bg-yellow-100"
                                        iconColor="text-yellow-600"
                                        onClick={() => setActiveModal("ai")}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1  gap-6 w-full">
                <div className="relative md:col-span-2" aria-busy={isLoading}>
                    <Calendar />
                </div>
                <div className="hidden md:col-span-1 md:flex md:flex-col bg-white rounded-xl border shadow-xs p-6">
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

function DashboardInsightsDialog({
    activeModal,
    onOpenChange,
}: {
    activeModal: "resources" | "ai" | null;
    onOpenChange: (open: boolean) => void;
}) {
    const isResources = activeModal === "resources";

    return (
        <Dialog open={!!activeModal} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isResources
                            ? "Supports disponibles"
                            : "Suggestions IA"}
                    </DialogTitle>
                    <DialogDescription>
                        {isResources
                            ? "Accès rapide aux supports de la semaine."
                            : "Analyse des leçons de la semaine et recommandations."}
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-lg border border-dashed border-muted p-4 text-sm text-muted-foreground">
                    {isResources
                        ? "Bientôt disponible : documents, supports et liens pour chaque leçon de la semaine, avec options de visualisation et impression."
                        : "Bientôt disponible : synthèse des leçons de la semaine et recommandations IA personnalisées."}
                </div>
            </DialogContent>
        </Dialog>
    );
}
