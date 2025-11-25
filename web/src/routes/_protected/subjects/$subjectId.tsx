import { useMemo, useState } from "react";
import { format } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import {
    AlertCircle,
    BookOpen,
    Download,
    Edit,
    Upload,
    MessageSquare,
    FileText,
    Paperclip,
    X,
    Clock,
    CheckCircle2,
    Circle,
    XCircle,
    PlayCircle,
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
import { Badge } from "@/components/ui/badge";
import { SkeletonPageDetail } from "@/components/ui/skeleton";
import { DetailMetric } from "@/components/DetailMetric";

import { useSubjectWithLessons } from "@/features/subjects/api/useSubjects";
import { CreateSubjectModal } from "@/features/subjects/components/CreateSubjectModal";
import type { EmptyStateProps } from "@/types/class.types";
import type { Lesson } from "@saas/shared";

export const Route = createFileRoute("/_protected/subjects/$subjectId")({
    component: SubjectDetailPage,
});

function SubjectDetailPage() {
    const { subjectId } = Route.useParams();
    const navigate = Route.useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const {
        data: subjectData,
        isLoading,
        isError,
        error,
    } = useSubjectWithLessons(subjectId ?? "");

    console.log(subjectData);

    const headerSubtitle = useMemo(() => {
        if (!subjectData) {
            return "";
        }
        return `${subjectData.type} • ${subjectData.hours_per_week}h / semaine • ${subjectData.total_hours}h total`;
    }, [subjectData]);

    const upcomingLessons = useMemo(() => {
        if (!subjectData || !subjectData.lessons) {
            return [];
        }

        return subjectData.lessons
            .map((lesson) => ({
                ...lesson,
                subject_name: subjectData.name,
                start_at: lesson.start_at ?? null,
                end_at: lesson.end_at ?? null,
                label: lesson.label ?? "Sans titre",
            }))
            .sort((a, b) => {
                const dateA = new Date(a.start_at || "").getTime();
                const dateB = new Date(b.start_at || "").getTime();
                return dateA - dateB;
            })
            .slice(0, 5);
    }, [subjectData]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Chargement de la matière…" />
                <SkeletonPageDetail
                    headerCard={true}
                    leftColumnCards={4}
                    rightColumnCards={3}
                />
            </div>
        );
    }

    if (isError || !subjectData) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Matière introuvable"
                    subtitle="Nous n'avons pas pu charger les informations de cette matière."
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
                                    to: "/subjects",
                                })
                            }
                        >
                            Retourner à la liste des matières
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={subjectData.name}
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
                        onClick: () => console.log("Export subject"),
                    },
                ]}
            />

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    <section className="flex flex-row space-between gap-6">
                        <DetailMetric
                            label="Heures / semaine"
                            value={subjectData.hours_per_week}
                        />
                        <DetailMetric
                            label="Heures totales"
                            value={subjectData.total_hours}
                        />
                        <DetailMetric
                            label="Leçons"
                            value={subjectData.lessons?.length ?? 0}
                        />
                    </section>

                    {/* {subjectData.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {subjectData.description}
                                </p>
                            </CardContent>
                        </Card>
                    )} */}

                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leçons</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {upcomingLessons.length === 0 ? (
                                    <EmptyState
                                        title="Aucune leçon planifiée prochainement"
                                        description="Ajoutez une séance pour qu'elle s'affiche ici."
                                    />
                                ) : (
                                    upcomingLessons.map((lesson, index) => {
                                        const estimatedTime = 50;
                                        // Show fake data only on first lesson for design preview
                                        const showFakeData = index === 0;

                                        return (
                                            <LessonCard
                                                key={lesson.id}
                                                lesson={lesson}
                                                estimatedTime={estimatedTime}
                                                showFakeData={showFakeData}
                                                onEdit={() =>
                                                    console.log(
                                                        "Edit lesson",
                                                        lesson.id
                                                    )
                                                }
                                                onImport={() =>
                                                    console.log(
                                                        "Import lesson",
                                                        lesson.id
                                                    )
                                                }
                                                onComment={() =>
                                                    console.log(
                                                        "Comment lesson",
                                                        lesson.id
                                                    )
                                                }
                                            />
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
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CreateSubjectModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                initialData={
                    subjectData
                        ? {
                              id: subjectData.id,
                              name: subjectData.name,
                              description: subjectData.description ?? null,
                              type: subjectData.type,
                              total_hours: subjectData.total_hours,
                              hours_per_week: subjectData.hours_per_week,
                          }
                        : undefined
                }
            />
        </div>
    );
}

type LessonStatus = "planned" | "in-progress" | "completed" | "cancelled";

function getLessonStatus(lesson: Lesson): LessonStatus {
    const now = new Date();
    const startDate = lesson.start_at ? new Date(lesson.start_at) : null;
    const endDate = lesson.end_at ? new Date(lesson.end_at) : null;

    // If no dates, consider it planned
    if (!startDate && !endDate) {
        return "planned";
    }

    // If end date is in the past, lesson is completed
    if (endDate && endDate < now) {
        return "completed";
    }

    // If start date is in the past but end date is in the future, it's in progress
    if (startDate && startDate <= now && endDate && endDate > now) {
        return "in-progress";
    }

    // If start date is in the future, it's planned
    if (startDate && startDate > now) {
        return "planned";
    }

    // Default to planned
    return "planned";
}

function getStatusConfig(status: LessonStatus) {
    switch (status) {
        case "completed":
            return {
                label: "Terminée",
                variant: "success" as const,
                icon: CheckCircle2,
            };
        case "in-progress":
            return {
                label: "En cours",
                variant: "default" as const,
                icon: PlayCircle,
            };
        case "cancelled":
            return {
                label: "Annulée",
                variant: "warning" as const,
                icon: XCircle,
            };
        case "planned":
        default:
            return {
                label: "Planifiée",
                variant: "outline" as const,
                icon: Circle,
            };
    }
}

function LessonCard({
    lesson,
    estimatedTime,
    showFakeData = false,
    onEdit,
    onImport,
    onComment,
}: {
    lesson: Lesson & { subject_name: string };
    estimatedTime: number;
    showFakeData?: boolean;
    onEdit: () => void;
    onImport: () => void;
    onComment: () => void;
}) {
    // Determine lesson status
    const status = getLessonStatus(lesson);
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    // Fake data for design preview
    const hasFiles = showFakeData;
    const fakeFiles = [
        { name: "Cours_Chapitre_3.pdf", size: "2.4 MB" },
        { name: "Exercices_Complementaires.docx", size: "856 KB" },
    ];

    return (
        <div className="group flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/30">
            {/* Main content */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60">
                            <BookOpen className="size-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground leading-tight">
                                    {lesson.label}
                                </h4>
                                <Badge
                                    variant={statusConfig.variant}
                                    className="text-xs"
                                >
                                    <StatusIcon className="size-3" />
                                    {statusConfig.label}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {estimatedTime > 0 && (
                                    <>
                                        <Clock className="size-4" />{" "}
                                        {estimatedTime} minutes
                                    </>
                                )}
                                <span className="flex items-center gap-1">
                                    <MessageSquare className="size-4" />
                                    {lesson?.comments?.length ?? 0}
                                </span>
                                {hasFiles && (
                                    <span className="flex items-center gap-1">
                                        <Paperclip className="size-4" />
                                        {fakeFiles.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onEdit}
                        className="h-8 w-8"
                        title="Modifier la leçon"
                    >
                        <Edit className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onImport}
                        className="h-8 w-8"
                        title="Importer du contenu"
                    >
                        <Upload className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onComment}
                        className="h-8 w-8"
                        title="Ajouter un commentaire"
                    >
                        <MessageSquare className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Comments section */}
            {lesson?.comments?.length > 0 &&
                lesson?.comments?.map((comment) => (
                    <div className="flex items-start gap-3 rounded-md bg-background/50 border border-border/40 p-3">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <MessageSquare className="size-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">
                                    {comment.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {format(comment.created_at, "dd/MM/yyyy")}
                                </span>
                            </div>
                            <p className="text-sm text-foreground">
                                {comment.description}
                            </p>
                        </div>
                    </div>
                ))}

            {/* Files section */}
            {hasFiles && fakeFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Paperclip className="size-3.5" />
                        <span className="font-medium">Fichiers joints:</span>
                    </div>
                    {fakeFiles.map((file, index) => (
                        <div
                            key={index}
                            className="group/file flex items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-1.5 hover:bg-accent transition-colors"
                        >
                            <FileText className="size-3.5 text-muted-foreground shrink-0" />
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs text-foreground truncate max-w-[200px]">
                                    {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    ({file.size})
                                </span>
                            </div>
                            <button
                                className="opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Remove file", file.name);
                                }}
                                title="Supprimer le fichier"
                            >
                                <X className="size-3 text-muted-foreground hover:text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
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
