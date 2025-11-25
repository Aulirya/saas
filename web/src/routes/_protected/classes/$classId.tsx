import { useMemo, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, BookOpen, Download, Edit } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonPageDetail } from "@/components/ui/skeleton";
import { DetailMetric } from "@/components/DetailMetric";

import { cn } from "@/lib/utils";
import { formatLessonDateTime } from "@/lib/date";

import { useSchoolClassWithSubjects } from "@/features/classes/api/useSchoolClass";
import { CreateClassModal } from "@/features/classes/components/CreateClassModal";
import type {
    SubjectWithLessons,
    LessonWithSubject,
    Subject,
    EmptyStateProps,
} from "@/types/class.types";

export const Route = createFileRoute("/_protected/classes/$classId")({
    component: ClassDetailPage,
});

function ClassDetailPage() {
    const { classId } = Route.useParams();
    const navigate = Route.useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const {
        data: classData,
        isLoading,
        isError,
        error,
    } = useSchoolClassWithSubjects(classId ?? "");

    const headerSubtitle = useMemo(() => {
        if (!classData) {
            return "";
        }
        return `${classData.level}  • ${classData.school} • Année`;
    }, [classData]);

    const upcomingLessons = useMemo(() => {
        if (!classData) {
            return [];
        }

        return (
            (classData.subjects as SubjectWithLessons[])
                .flatMap((subject: SubjectWithLessons) => {
                    const lessons = subject.lessons || [];
                    return lessons.map((lesson) => ({
                        ...lesson,
                        subject_name: subject.name,
                    }));
                })
                //filter to get the next lessons
                // .filter(
                //     (lesson: LessonWithSubject) =>
                //         lesson.start_at && new Date(lesson.start_at) >= now
                // )
                .sort(
                    (a: LessonWithSubject, b: LessonWithSubject) =>
                        new Date(a.start_at || "").getTime() -
                        new Date(b.start_at || "").getTime()
                )
                .slice(0, 3)
        );
    }, [classData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Chargement de la classe…" />
                <SkeletonPageDetail
                    headerCard={true}
                    leftColumnCards={4}
                    rightColumnCards={3}
                />
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
                        onClick: () => setIsEditModalOpen(true),
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
                            value={classData.students_count}
                        />
                        <DetailMetric
                            label="Matières"
                            value={classData.subjects_count}
                        />
                        <DetailMetric
                            label="Heures / semaine"
                            value={classData.weekly_hours}
                        />
                        {/* <DetailMetric
                            label="Moyenne générale"
                            value={`${numberFormatter.format(
                                classData.students_count
                            )}/20`}
                        /> */}
                    </section>

                    <div className="grid grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cours donnés</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!classData.subjects ||
                                (classData.subjects as Subject[]).length ===
                                    0 ? (
                                    <EmptyState
                                        title="Aucun cours assigné"
                                        description="Ajoutez des matières à cette classe pour qu'elles s'affichent ici."
                                    />
                                ) : (
                                    (classData.subjects as Subject[]).map(
                                        (subject) => {
                                            const SubjectIcon = BookOpen;
                                            const iconBg = "bg-muted";
                                            const iconColor =
                                                "text-muted-foreground";

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
                                                                {
                                                                    subject.category
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Prochaines leçons</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {upcomingLessons.length === 0 ? (
                                    <EmptyState
                                        title="Aucun cours planifié prochainement"
                                        description="Ajoutez une séance pour qu'elle s'affiche ici."
                                    />
                                ) : (
                                    upcomingLessons.map((lesson) => {
                                        const { dateStr, timeStr } =
                                            formatLessonDateTime(
                                                lesson.start_at,
                                                lesson.end_at
                                            );

                                        return (
                                            <div
                                                key={lesson.id}
                                                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm"
                                            >
                                                <span className="font-semibold text-foreground">
                                                    {lesson.subject_name} —{" "}
                                                    {lesson.label}
                                                </span>
                                                {dateStr && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {dateStr}
                                                        {timeStr &&
                                                            ` • ${timeStr}`}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
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
                            <EmptyState
                                title="Aucune analyse pour le moment"
                                description="Les recommandations apparaîtront ici dès qu'elles seront disponibles."
                            />
                            {/* {classData.analyses.length === 0 ? (
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
                            )} */}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CreateClassModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                initialData={
                    classData
                        ? {
                              id: classData.id,
                              name: classData.name,
                              level: classData.level,
                              school: classData.school,
                              students_count: classData.students_count,
                              subjects: (classData.subjects as Subject[])?.map(
                                  (s) => s.id
                              ),
                          }
                        : undefined
                }
            />
        </div>
    );
}

function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6">
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
