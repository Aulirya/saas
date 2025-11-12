import { useMemo, type ComponentType } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import {
    AlertCircle,
    Atom,
    BookOpen,
    Calculator,
    Clock,
    Download,
    Edit,
    FlaskConical,
    GraduationCap,
    TrendingUp,
    Users,
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

const subjectIconBgClasses: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    orange: "bg-orange-50",
    purple: "bg-purple-50",
};

const subjectIconColorClasses: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
};

const subjectIconMap: Record<string, ComponentType<{ className?: string }>> = {
    Mathématiques: Calculator,
    Maths: Calculator,
    Chimie: FlaskConical,
    Physique: Atom,
    "Physique-Chimie": Atom,
    Français: BookOpen,
    Histoire: BookOpen,
    Géographie: BookOpen,
    Anglais: BookOpen,
    Espagnol: BookOpen,
    Allemand: BookOpen,
    SVT: FlaskConical,
    "Sciences de la vie et de la Terre": FlaskConical,
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

        return `${classData.level}  • ${classData.school} • Année ${classData.year} `;
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
                        disabled: true,
                        variant: "outline",
                        onClick: () => console.log("Edit class"),
                    },
                    {
                        label: "Ajouter élève",
                        icon: UserPlus,
                        disabled: true,
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

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    <section className="flex flex-row space-between gap-6">
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
                    </section>

                    <div className="grid grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cours donnés</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {classData.subjects.map((subject) => {
                                    const SubjectIcon =
                                        subjectIconMap[subject.name] ||
                                        BookOpen;
                                    const iconBg =
                                        subjectIconBgClasses[subject.color] ||
                                        "bg-muted";
                                    const iconColor =
                                        subjectIconColorClasses[
                                            subject.color
                                        ] || "text-muted-foreground";

                                    return (
                                        <div
                                            key={subject.id}
                                            className="flex items-center justify-between rounded-lg  bg-background px-4 py-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "flex size-10 items-center justify-center rounded-lg",
                                                        iconBg,
                                                        iconColor
                                                    )}
                                                >
                                                    <SubjectIcon className="size-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {subject.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {subject.hoursPerWeek}h
                                                        / semaine
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Prochaines leçons</CardTitle>
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
                                                          ].replace(
                                                              "bg-",
                                                              "text-"
                                                          )
                                                        : ""
                                                )}
                                            >
                                                {course.subject} —{" "}
                                                {course.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {course.date} • {course.time}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

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
            </div>
        </div>
    );
}

type MetricConfig = {
    icon: ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
};

const metricConfigs: Record<string, MetricConfig> = {
    Élèves: {
        icon: Users,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
    },
    Matières: {
        icon: BookOpen,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
    },
    "Heures / semaine": {
        icon: Clock,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
    },
    "Moyenne générale": {
        icon: TrendingUp,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
    },
};

function DetailMetric({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    const config = metricConfigs[label] || {
        icon: GraduationCap,
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
    };
    const Icon = config.icon;

    return (
        <Card className="grow rounded-lg border border-border/60 bg-background px-4 py-3">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        config.iconBg,
                        config.iconColor
                    )}
                >
                    <Icon className="size-5" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                        {value}
                    </p>
                </div>
            </div>
        </Card>
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
