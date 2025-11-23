import { useMemo } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Download, Edit, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SummaryStat } from "@/components/ui/summary-stat";
import { SkeletonPageDetail } from "@/components/ui/skeleton";
import { DetailMetric } from "@/components/DetailMetric";
import { useCourseProgram } from "@/features/courses/api/useCourseProgram";
import type { CourseProgram } from "@/features/courses/types";
import { cn } from "@/lib/utils";

const statusToBadgeVariant: Record<
    CourseProgram["status"],
    "success" | "warning" | "muted"
> = {
    defined: "success",
    partial: "warning",
    draft: "muted",
};

const numberFormatter = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
});

export const Route = createFileRoute("/_protected/courses/$courseId")({
    component: CourseDetailPage,
});

function CourseDetailPage() {
    const { courseId } = Route.useParams();
    const navigate = Route.useNavigate();

    const {
        data: courseData,
        isLoading,
        isError,
        error,
    } = useCourseProgram(courseId);

    const headerSubtitle = useMemo(() => {
        if (!courseData) {
            return "";
        }

        return `${courseData.level} • ${courseData.weeklyHours}h/semaine • ${courseData.students} élèves`;
    }, [courseData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Chargement du cours…" />
                <SkeletonPageDetail
                    headerCard={true}
                    leftColumnCards={3}
                    rightColumnCards={0}
                    showRightColumn={false}
                />
            </div>
        );
    }

    if (isError || !courseData) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Cours introuvable"
                    subtitle="Nous n'avons pas pu charger les informations de ce cours."
                />
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="size-5" />
                            Problème lors du chargement
                        </CardTitle>
                        <CardDescription>
                            {error instanceof Error
                                ? error.message
                                : "Identifiant invalide ou données manquantes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() =>
                                navigate({
                                    to: "/courses",
                                })
                            }
                        >
                            Retourner à la liste des cours
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const progressValue = Math.round(
        (courseData.completedHours / Math.max(courseData.totalHours, 1)) * 100
    );
    const completedText = `${numberFormatter.format(
        courseData.completedHours
    )} / ${numberFormatter.format(
        courseData.totalHours
    )} heures (${progressValue}%)`;

    const Icon = courseData.icon;

    return (
        <div className="space-y-6">
            <PageHeader
                title={courseData.subject}
                subtitle={headerSubtitle}
                variant="detailed"
                actions={[
                    {
                        label: "Modifier",
                        icon: Edit,
                        disabled: true,
                        variant: "outline",
                        onClick: () => console.log("Edit course"),
                    },
                    {
                        label: "Exporter",
                        icon: Download,
                        disabled: true,
                        onClick: () => console.log("Export course"),
                    },
                ]}
            />

            <div className="space-y-6">
                <section className="flex flex-row space-between gap-6">
                    <DetailMetric label="Élèves" value={courseData.students} />
                    {/* // adapt the component it is not flexible at all */}
                    <DetailMetric
                        label="Fichiers uploadés"
                        value={numberFormatter.format(courseData.totalHours)}
                    />
                    <Card className="grow rounded-lg border border-border/60 bg-background px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    "flex size-10 items-center justify-center rounded-lg",
                                    "bg-purple-50",
                                    "text-purple-600"
                                )}
                            >
                                <TrendingUp className="size-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">
                                    Progression :
                                </p>
                                <p className="mt-1 t font-semibold text-foreground">
                                    {completedText}{" "}
                                    <Progress value={progressValue} />
                                </p>
                            </div>
                        </div>
                    </Card>
                </section>

                <div className="grid grid-cols-5 gap-6">
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Prochains chapitres</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {courseData.nextLessons.length === 0 ? (
                                <EmptyState
                                    title="Aucun chapitre planifié"
                                    description="Ajoutez un chapitre pour qu'il s'affiche ici."
                                />
                            ) : (
                                courseData.nextLessons.map((chapter, index) => (
                                    <div
                                        key={chapter.id}
                                        className={cn(
                                            "flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm transition-colors",
                                            index === 0 &&
                                                "border-primary/50 bg-primary/5"
                                        )}
                                    >
                                        <span className="font-medium text-foreground">
                                            {chapter.title}
                                        </span>
                                        <span className="text-primary text-xs">
                                            {chapter.plannedHours}h planifiées
                                        </span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Statistiques</CardTitle>
                            <CardDescription>
                                Indicateurs de suivi du cours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <SummaryStat
                                    label="Supports uploadés"
                                    value={numberFormatter.format(
                                        courseData.stats.uploads
                                    )}
                                />
                                <SummaryStat
                                    label="Évaluations"
                                    value={numberFormatter.format(
                                        courseData.stats.evaluations
                                    )}
                                />
                                <SummaryStat
                                    label="Durée moyenne des cours"
                                    value={`${courseData.stats.averageLessonMinutes} min`}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6">
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
