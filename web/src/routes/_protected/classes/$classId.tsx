import { useMemo } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import {
    AlertCircle,
    Download,
    Edit,
    GraduationCap,
    UserPlus,
} from "lucide-react";

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
import { SummaryStat } from "@/components/ui/summary-stat";
import { useSchoolClass } from "@/features/classes/api/useSchoolClass";
import type { SchoolClassExtended } from "@/features/classes/types";
import { cn } from "@/lib/utils";

const statusToBadgeVariant: Record<
    SchoolClassExtended["status"],
    "success" | "warning" | "muted"
> = {
    active: "success",
    paused: "warning",
};

const distributionColorToClassName: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    orange: "bg-orange-500",
    purple: "bg-purple-600",
};

const numberFormatter = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
});

export const Route = createFileRoute("/_protected/classes/$classId")({
    component: ClassDetailPage,
});

function ClassDetailPage() {
    const { classId } = Route.useParams();
    const navigate = Route.useNavigate();

    const {
        data: classData,
        isLoading,
        isError,
        error,
    } = useSchoolClass(classId);

    const headerSubtitle = useMemo(() => {
        if (!classData) {
            return "";
        }

        return `${classData.school} • Année ${classData.year}`;
    }, [classData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Chargement de la classe…" />
                <ClassDetailSkeleton />
            </div>
        );
    }

    if (isError || !classData) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Classe introuvable"
                    subtitle="Nous n'avons pas pu charger les informations de cette classe."
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
                                    to: "/classes",
                                })
                            }
                        >
                            Retourner à la liste des classes
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={classData.name}
                subtitle={headerSubtitle}
                variant="detailed"
                actions={[
                    {
                        label: "Modifier",
                        icon: Edit,
                        variant: "outline",
                        onClick: () => console.log("Edit class"),
                    },
                    {
                        label: "Ajouter élève",
                        icon: UserPlus,
                        onClick: () => console.log("Add student"),
                    },
                    {
                        label: "Exporter",
                        icon: Download,
                        disabled: true,
                        onClick: () => console.log("Export class"),
                    },
                ]}
            />

            <Card>
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <GraduationCap className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Niveau {classData.level}
                                </p>
                                <p className="text-xl font-semibold text-foreground">
                                    {classData.studentsCount} élèves suivis
                                </p>
                            </div>
                        </div>
                    </div>
                    <Badge variant={statusToBadgeVariant[classData.status]}>
                        {classData.statusLabel}
                    </Badge>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations générales</CardTitle>
                            <CardDescription>
                                Vue d&apos;ensemble des indicateurs clés et de
                                l&apos;organisation de la classe.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <DetailMetric
                                    label="Élèves"
                                    value={classData.studentsCount}
                                />
                                <DetailMetric
                                    label="Matières"
                                    value={classData.subjectsCount}
                                />
                                <DetailMetric
                                    label="Heures / semaine"
                                    value={classData.hoursPerWeek}
                                />
                                <DetailMetric
                                    label="Moyenne générale"
                                    value={`${numberFormatter.format(
                                        classData.generalAverage
                                    )}/20`}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        Organisation annuelle
                                    </p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li>
                                            <span className="text-muted-foreground">
                                                Établissement&nbsp;:
                                            </span>{" "}
                                            {classData.school}
                                        </li>
                                        <li>
                                            <span className="text-muted-foreground">
                                                Année scolaire&nbsp;:
                                            </span>{" "}
                                            {classData.year}
                                        </li>
                                        <li>
                                            <span className="text-muted-foreground">
                                                Niveau&nbsp;:
                                            </span>{" "}
                                            {classData.level}
                                        </li>
                                    </ul>
                                </div>

                                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        Intervenir auprès des élèves
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                console.log("Plan support")
                                            }
                                        >
                                            Plan de soutien
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                console.log("Send message")
                                            }
                                        >
                                            Envoyer un message
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                console.log("Create report")
                                            }
                                        >
                                            Créer un rapport
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Programme & options</CardTitle>
                            <CardDescription>
                                Aperçu des matières et de leur répartition
                                horaire.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {classData.subjects.map((subject) => {
                                const isOption =
                                    subject.hoursPerWeek <
                                    classData.hoursPerWeek /
                                        Math.max(1, classData.subjects.length);

                                return (
                                    <div
                                        key={subject.id}
                                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    "size-2 rounded-full",
                                                    distributionColorToClassName[
                                                        subject.color
                                                    ] || "bg-primary"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {subject.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {subject.hoursPerWeek}h /
                                                    semaine
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={
                                                isOption ? "default" : "outline"
                                            }
                                        >
                                            {isOption
                                                ? "Option"
                                                : "Tronc commun"}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Prochains cours</CardTitle>
                            <CardDescription>
                                Les trois prochaines séances planifiées.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {classData.upcomingCourses.length === 0 ? (
                                <EmptyState
                                    title="Aucun cours planifié prochainement"
                                    description="Ajoutez une séance pour qu'elle s'affiche ici."
                                />
                            ) : (
                                classData.upcomingCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm"
                                    >
                                        <span
                                            className={cn(
                                                "font-semibold text-foreground",
                                                distributionColorToClassName[
                                                    course.color
                                                ]
                                                    ? distributionColorToClassName[
                                                          course.color
                                                      ].replace("bg-", "text-")
                                                    : ""
                                            )}
                                        >
                                            {course.subject} — {course.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {course.date} • {course.time}
                                        </span>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Analyses et recommandations</CardTitle>
                            <CardDescription>
                                Points d&apos;attention identifiés par la
                                plateforme.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {classData.analyses.length === 0 ? (
                                <EmptyState
                                    title="Aucune analyse pour le moment"
                                    description="Les recommandations apparaîtront ici dès qu'elles seront disponibles."
                                />
                            ) : (
                                classData.analyses.map((analysis, index) => (
                                    <div
                                        key={`${analysis.type}-${index}`}
                                        className={cn(
                                            "rounded-lg border px-4 py-3 text-sm",
                                            analysis.type === "success" &&
                                                "border-emerald-200 bg-emerald-50 text-emerald-700",
                                            analysis.type === "warning" &&
                                                "border-amber-200 bg-amber-50 text-amber-700"
                                        )}
                                    >
                                        {analysis.message}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistiques</CardTitle>
                            <CardDescription>
                                Indicateurs de suivi de la classe.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SummaryStat
                                label="Présence moyenne"
                                value={`${classData.statistics.averageAttendance}%`}
                            />
                            <SummaryStat
                                label="Devoirs rendus"
                                value={`${classData.statistics.homeworkSubmitted}%`}
                            />
                            <SummaryStat
                                label="Évaluations réalisées"
                                value={numberFormatter.format(
                                    classData.statistics.evaluations
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Répartition horaire</CardTitle>
                            <CardDescription>
                                Visualisez le poids de chaque matière dans la
                                semaine.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {classData.subjectDistribution.map(
                                (distribution) => (
                                    <div
                                        key={distribution.subject}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {distribution.subject}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {distribution.hoursPerWeek}h —{" "}
                                                {distribution.percentage}%
                                            </span>
                                        </div>
                                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className={cn(
                                                    "h-full transition-all",
                                                    distributionColorToClassName[
                                                        distribution.color
                                                    ] ?? "bg-primary"
                                                )}
                                                style={{
                                                    transform: `translateX(-${
                                                        100 -
                                                        distribution.percentage
                                                    }%)`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function DetailMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
                {value}
            </p>
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

function ClassDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-muted" />
                        <div className="space-y-2">
                            <div className="h-4 w-40 rounded bg-muted" />
                            <div className="h-4 w-20 rounded bg-muted" />
                        </div>
                    </div>
                    <div className="h-6 w-32 rounded-full bg-muted" />
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((key) => (
                        <Card key={key} className="border-dashed">
                            <CardHeader>
                                <div className="h-5 w-48 rounded bg-muted" />
                                <div className="mt-2 h-4 w-64 rounded bg-muted" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-3 w-full rounded-full bg-muted" />
                                <div className="h-3 w-3/4 rounded-full bg-muted" />
                                <div className="h-3 w-2/4 rounded-full bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="space-y-6">
                    {[5, 6, 7].map((key) => (
                        <Card key={key} className="border-dashed">
                            <CardHeader>
                                <div className="h-5 w-40 rounded bg-muted" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-3 w-full rounded-full bg-muted" />
                                <div className="h-3 w-2/3 rounded-full bg-muted" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
