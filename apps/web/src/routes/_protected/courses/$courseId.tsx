import { useMemo } from "react";

import { createFileRoute } from "@tanstack/react-router";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Download,
    Edit,
    TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
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
import { useCourseProgressById } from "@/features/courses/api/useCourseProgress";
import { RecurringScheduleConfig } from "@/features/courses/components/RecurringScheduleConfig";
import { cn } from "@/lib/utils";

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

    // Fetch course progress for schedule configuration
    const { data: courseProgress } = useCourseProgressById(courseId);
    console.log("courseProgress", courseProgress);

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
                    <DetailMetric
                        label="Heures totales"
                        value={numberFormatter.format(courseData.totalHours)}
                    />
                    <DetailMetric
                        label="Heures par semaine"
                        icon={Calendar}
                        value={`${numberFormatter.format(
                            courseData.weeklyHours
                        )}`}
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

                <div className="flex gap-6">
                    <div className="flex-1 min-w-0 space-y-6">
                        <Card>
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
                                    courseData.nextLessons.map(
                                        (chapter, index) => (
                                            <div
                                                key={chapter.id}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm transition-colors",
                                                    index === 0 &&
                                                        "border-primary/50 bg-primary/5"
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-foreground">
                                                        {chapter.title}
                                                    </span>
                                                    {chapter.date && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {chapter.date.toLocaleDateString(
                                                                "fr-FR",
                                                                {
                                                                    weekday:
                                                                        "long",
                                                                    year: "numeric",
                                                                    month: "long",
                                                                    day: "numeric",
                                                                }
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Chapitres terminés</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {courseData.completedLessons.length === 0 ? (
                                    <EmptyState
                                        title="Aucun chapitre terminé"
                                        description="Les chapitres terminés apparaîtront ici."
                                    />
                                ) : (
                                    courseData.completedLessons
                                        .slice(0, 10)
                                        .map((chapter) => (
                                            <div
                                                key={chapter.id}
                                                className="flex items-center justify-between rounded-lg border border-green-200/60 bg-green-50/50 px-4 py-3 text-sm transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 className="size-5 text-green-600 shrink-0" />
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-foreground">
                                                            {chapter.title}
                                                        </span>
                                                        {chapter.date && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Terminé le{" "}
                                                                {chapter.date.toLocaleDateString(
                                                                    "fr-FR",
                                                                    {
                                                                        year: "numeric",
                                                                        month: "long",
                                                                        day: "numeric",
                                                                    }
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-green-700 text-xs font-medium">
                                                    {numberFormatter.format(
                                                        chapter.plannedHours
                                                    )}
                                                    h
                                                </span>
                                            </div>
                                        ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="shrink-0 w-80 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="size-5" />
                                    Créneaux horaires
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {courseProgress ? (
                                    <RecurringScheduleConfig
                                        courseId={courseId}
                                        initialSlots={
                                            courseProgress.recurring_schedule ||
                                            []
                                        }
                                    />
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        Chargement des informations de
                                        planification...
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="hidden">
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
