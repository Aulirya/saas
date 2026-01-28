import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    MessageSquare,
    Plus,
    Edit,
    Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonPageDetail } from "@/components/ui/skeleton";
import { useLessonProgress } from "@/features/courses/api/useLessonProgress";
import { useUpdateLessonProgress } from "@/features/courses/api/useLessonProgress";
import { useCourseProgressById } from "@/features/courses/api/useCourseProgress";
import { useSubjects } from "@/features/subjects/api/useSubjects";
import { useSchoolClasses } from "@/features/classes/api/useSchoolClasses";
import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Route as CourseDetailRoute } from "../../$courseId";
import { LessonCommentForm } from "@/features/courses/components/LessonCommentForm";

export const Route = createFileRoute(
    "/_protected/courses/$courseId/lessons/$lessonProgressId"
)({
    component: LessonDetailPage,
});

function LessonDetailPage() {
    const { courseId, lessonProgressId } = Route.useParams();
    const navigate = Route.useNavigate();

    // Fetch lesson progress
    const {
        data: lessonProgress,
        isLoading: isLoadingProgress,
        isError: isErrorProgress,
    } = useLessonProgress(lessonProgressId);

    // Fetch course progress for context
    const { data: courseProgress } = useCourseProgressById(courseId);
    
    // Fetch subjects and classes for display
    const { data: allSubjects = [] } = useSubjects();
    const { data: allClasses = [] } = useSchoolClasses();

    // Fetch lesson details
    const { data: lesson } = useQuery({
        ...orpc.lesson.get.queryOptions({
            input: { id: lessonProgress?.lesson_id || "" },
        }),
        enabled: !!lessonProgress?.lesson_id,
        staleTime: 60_000,
    });

    const updateLessonProgress = useUpdateLessonProgress();

    // Comment form state
    const [commentFormOpen, setCommentFormOpen] = useState(false);
    const [editingCommentIndex, setEditingCommentIndex] = useState<number | null>(null);

    // Get subject and class for display
    const subject = useMemo(() => {
        if (!courseProgress) return null;
        return allSubjects.find((s) => s.id === courseProgress.subject_id);
    }, [courseProgress, allSubjects]);

    const schoolClass = useMemo(() => {
        if (!courseProgress) return null;
        return allClasses.find((c) => c.id === courseProgress.class_id);
    }, [courseProgress, allClasses]);

    // Format scheduled date
    const scheduledDateStr = useMemo(() => {
        if (!lessonProgress?.scheduled_date) return null;
        try {
            return format(parseISO(lessonProgress.scheduled_date), "EEEE d MMMM yyyy 'à' HH'h'mm");
        } catch {
            return lessonProgress.scheduled_date;
        }
    }, [lessonProgress?.scheduled_date]);

    // Format completed date
    const completedDateStr = useMemo(() => {
        if (!lessonProgress?.completed_at) return null;
        try {
            return format(parseISO(lessonProgress.completed_at), "EEEE d MMMM yyyy 'à' HH'h'mm");
        } catch {
            return lessonProgress.completed_at;
        }
    }, [lessonProgress?.completed_at]);

    if (isLoadingProgress) {
        return (
            <PageLayout
                header={<PageHeader title="Chargement de la leçon…" />}
            >
                <SkeletonPageDetail
                    headerCard={true}
                    leftColumnCards={2}
                    rightColumnCards={1}
                />
            </PageLayout>
        );
    }

    if (isErrorProgress || !lessonProgress || !lesson) {
        return (
            <PageLayout
                header={
                    <PageHeader
                        title="Leçon introuvable"
                        subtitle="Nous n'avons pas pu charger les informations de cette leçon."
                    />
                }
            >
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="size-5" />
                            Problème lors du chargement
                        </CardTitle>
                        <CardDescription>
                            La leçon demandée n'existe pas ou vous n'avez pas
                            l'autorisation d'y accéder.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() =>
                                navigate({
                                    to: CourseDetailRoute.to,
                                    params: { courseId },
                                })
                            }
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            Retour au cours
                        </Button>
                    </CardContent>
                </Card>
            </PageLayout>
        );
    }

    const headerSubtitle = useMemo(() => {
        const parts: string[] = [];
        if (subject) parts.push(subject.name);
        if (schoolClass) parts.push(schoolClass.name);
        return parts.join(" • ");
    }, [subject, schoolClass]);

    return (
        <PageLayout
            header={
                <PageHeader
                    title={lesson.label}
                    subtitle={headerSubtitle}
                    variant="detailed"
                    actions={[
                        {
                            label: "Retour",
                            icon: ArrowLeft,
                            variant: "outline",
                            onClick: () =>
                                navigate({
                                    to: CourseDetailRoute.to,
                                    params: { courseId },
                                }),
                        },
                    ]}
                />
            }
        >
            <div className="space-y-6">
                {/* Lesson Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de la leçon</CardTitle>
                        <CardDescription>
                            Détails et statut de la leçon
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <Calendar className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Date planifiée
                                    </p>
                                    <p className="font-medium">
                                        {scheduledDateStr || "Non planifiée"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "flex size-10 items-center justify-center rounded-lg",
                                        lessonProgress.status === "completed"
                                            ? "bg-green-50 text-green-600"
                                            : lessonProgress.status === "scheduled"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-gray-50 text-gray-600"
                                    )}
                                >
                                    {lessonProgress.status === "completed" ? (
                                        <CheckCircle2 className="size-5" />
                                    ) : (
                                        <Clock className="size-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Statut
                                    </p>
                                    <p className="font-medium capitalize">
                                        {lessonProgress.status === "completed"
                                            ? "Terminée"
                                            : lessonProgress.status === "scheduled"
                                            ? "Planifiée"
                                            : lessonProgress.status === "in_progress"
                                            ? "En cours"
                                            : "Non démarrée"}
                                    </p>
                                </div>
                            </div>

                            {completedDateStr && (
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Date de complétion
                                        </p>
                                        <p className="font-medium">
                                            {completedDateStr}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {lesson.duration && (
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Durée
                                        </p>
                                        <p className="font-medium">
                                            {lesson.duration} minutes
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {lesson.description && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Description
                                </p>
                                <p className="text-sm">{lesson.description}</p>
                            </div>
                        )}

                        {/* Mark as complete button */}
                        {lessonProgress.status !== "completed" && (
                            <div className="pt-4 border-t">
                                <Button
                                    onClick={async () => {
                                        await updateLessonProgress.mutateAsync({
                                            id: lessonProgressId,
                                            status: "completed",
                                            completed_at: new Date().toISOString(),
                                        });
                                    }}
                                    className="w-full md:w-auto"
                                >
                                    <CheckCircle2 className="size-4 mr-2" />
                                    Marquer comme terminée
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Comments Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="size-5" />
                                    Commentaires
                                </CardTitle>
                                <CardDescription>
                                    Ajoutez des notes et réflexions sur cette
                                    leçon
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => {
                                    setEditingCommentIndex(null);
                                    setCommentFormOpen(true);
                                }}
                                size="sm"
                            >
                                <Plus className="size-4 mr-2" />
                                Ajouter un commentaire
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {lessonProgress.comments &&
                        lessonProgress.comments.length > 0 ? (
                            <div className="space-y-4">
                                {lessonProgress.comments.map((comment, index) => (
                                    <CommentCard
                                        key={index}
                                        comment={comment}
                                        onEdit={() => {
                                            setEditingCommentIndex(index);
                                            setCommentFormOpen(true);
                                        }}
                                        onDelete={async () => {
                                            const updatedComments =
                                                lessonProgress.comments?.filter(
                                                    (_, i) => i !== index
                                                ) || [];
                                            await updateLessonProgress.mutateAsync({
                                                id: lessonProgressId,
                                                comments: updatedComments,
                                            });
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="size-12 mx-auto mb-2 opacity-50" />
                                <p>Aucun commentaire pour le moment</p>
                                <p className="text-sm mt-1">
                                    Ajoutez votre premier commentaire pour
                                    commencer
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Comment Form Modal */}
            <LessonCommentForm
                open={commentFormOpen}
                onOpenChange={setCommentFormOpen}
                initialComment={
                    editingCommentIndex !== null &&
                    lessonProgress.comments?.[editingCommentIndex]
                        ? {
                              title:
                                  lessonProgress.comments[editingCommentIndex]
                                      .title,
                              description:
                                  lessonProgress.comments[editingCommentIndex]
                                      .description,
                          }
                        : undefined
                }
                onSubmit={async (comment) => {
                    const currentComments = lessonProgress.comments || [];
                    let updatedComments;

                    if (editingCommentIndex !== null) {
                        // Update existing comment
                        updatedComments = [...currentComments];
                        updatedComments[editingCommentIndex] = {
                            ...comment,
                            created_at:
                                currentComments[editingCommentIndex]
                                    .created_at || new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        };
                    } else {
                        // Add new comment
                        updatedComments = [
                            ...currentComments,
                            {
                                ...comment,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            },
                        ];
                    }

                    await updateLessonProgress.mutateAsync({
                        id: lessonProgressId,
                        comments: updatedComments,
                    });
                }}
            />
        </PageLayout>
    );
}

function CommentCard({
    comment,
    onEdit,
    onDelete,
}: {
    comment: { title?: string; description: string; created_at?: string; updated_at?: string };
    onEdit: () => void;
    onDelete: () => void;
}) {
    const dateStr = useMemo(() => {
        if (!comment.created_at) return null;
        try {
            return format(parseISO(comment.created_at), "d MMMM yyyy 'à' HH'h'mm");
        } catch {
            return comment.created_at;
        }
    }, [comment.created_at]);

    return (
        <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {comment.title && (
                        <h4 className="font-medium mb-1">{comment.title}</h4>
                    )}
                    <p className="text-sm text-muted-foreground">
                        {comment.description}
                    </p>
                    {dateStr && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {dateStr}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="h-8 w-8 p-0"
                    >
                        <Edit className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

