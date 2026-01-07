import { useMemo, useState } from "react";
import { format } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import {
    AlertCircle,
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
    PlayCircle,
    ChevronUp,
    ChevronDown,
    Plus,
    Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubjectWithLessons } from "@/features/subjects/api/useSubjects";
import { SubjectFormModal } from "@/features/subjects/components/SubjectFormModal";
import { LessonFormModal } from "@/features/subjects/components/LessonFormModal";
import type { EmptyStateProps } from "@/types/class.types";
import type { Lesson } from "@saas/shared";
import { getCategoryLabel, getCategoryConfig } from "@/lib/subject-utils";
import { getScopeLabel, getScopeConfig } from "@/lib/lesson-scope";
import { orpc } from "@/orpc/client";

export const Route = createFileRoute("/_protected/subjects/$subjectId")({
    component: SubjectDetailPage,
});

function SubjectDetailPage() {
    const { subjectId } = Route.useParams();
    const navigate = Route.useNavigate();
    const queryClient = useQueryClient();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLessonFormModalOpen, setIsLessonFormModalOpen] = useState(false);
    const [lessonToEdit, setLessonToEdit] = useState<
        (Lesson & { subject_name: string }) | null
    >(null);
    const [lessonForComments, setLessonForComments] = useState<Lesson | null>(
        null
    );
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const {
        data: subjectData,
        isLoading,
        isError,
        error,
    } = useSubjectWithLessons(subjectId ?? "");

    console.log(subjectData);

    const upcomingLessons = useMemo(() => {
        if (!subjectData || !subjectData.lessons) {
            return [];
        }

        return subjectData.lessons
            .map((lesson) => ({
                ...lesson,
                subject_name: subjectData.name,
                label: lesson.label ?? "Sans titre",
            }))
            .sort((a, b) => {
                const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
                if (orderA !== orderB) return orderA - orderB;
                return a.label.localeCompare(b.label);
            });
    }, [subjectData]);

    console.log("upcomingLessons", upcomingLessons);

    const { mutate: updateLessonComments } = useMutation({
        mutationFn: async (params: {
            id: string;
            comments: { title: string; description: string }[];
        }) => {
            return await orpc.lesson.patch.call({
                id: params.id,
                comments: params.comments,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lessons"] });
            queryClient.invalidateQueries({
                queryKey: orpc.lesson.list.queryKey({}),
            });
            if (subjectId) {
                queryClient.invalidateQueries({
                    queryKey: orpc.subject.getWithLessons.queryKey({
                        input: { id: subjectId },
                    }),
                });
            }
            toast.success("Commentaires de la leçon mis à jour");
            setIsCommentsModalOpen(false);
            setLessonForComments(null);
        },
        onError: (error: unknown) => {
            console.error("Error updating lesson comments:", error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";
            toast.error(errorMsg);
        },
    });

    const { mutate: deleteLesson } = useMutation({
        mutationFn: async (id: string) => {
            return await orpc.lesson.delete.call({ id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lessons"] });
            queryClient.invalidateQueries({
                queryKey: orpc.lesson.list.queryKey({}),
            });
            if (subjectId) {
                queryClient.invalidateQueries({
                    queryKey: orpc.subject.getWithLessons.queryKey({
                        input: { id: subjectId },
                    }),
                });
            }
            toast.success("Leçon supprimée avec succès");
            setIsDeleteDialogOpen(false);
            setLessonToDelete(null);
        },
        onError: (error: unknown) => {
            console.error("Error deleting lesson:", error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";
            toast.error(errorMsg);
        },
    });

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
                        {(() => {
                            const categoryConfig = getCategoryConfig(
                                subjectData.category
                            );
                            const CategoryIcon = categoryConfig.icon;
                            return (
                                <DetailMetric
                                    label="Catégorie"
                                    value={getCategoryLabel(
                                        subjectData.category
                                    )}
                                    icon={CategoryIcon}
                                    iconBg={categoryConfig.color}
                                    iconColor={categoryConfig.iconColor}
                                />
                            );
                        })()}
                        <DetailMetric
                            label="Leçons"
                            value={subjectData.lessons?.length ?? 0}
                        />
                    </section>

                    <div className="space-y-6 grid grid-cols-7 lg:gap-6">
                        <div className="col-span-full lg:col-span-5  gap-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Leçons</CardTitle>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setLessonToEdit(null);
                                                setIsLessonFormModalOpen(true);
                                            }}
                                        >
                                            <Plus className="size-4 mr-2" />
                                            Nouvelle leçon
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {upcomingLessons.length === 0 ? (
                                        <EmptyState
                                            title="Aucune leçon planifiée prochainement"
                                            description="Ajoutez une séance pour qu'elle s'affiche ici."
                                        />
                                    ) : (
                                        upcomingLessons.map((lesson, index) => {
                                            const estimatedTime =
                                                lesson.duration ?? 60;
                                            const displayOrder =
                                                lesson.order ?? index + 1;
                                            // Show fake data only on first lesson for design preview
                                            const showFakeData = index === 0;

                                            return (
                                                <LessonCard
                                                    key={lesson.id}
                                                    lesson={lesson}
                                                    estimatedTime={
                                                        estimatedTime
                                                    }
                                                    displayOrder={displayOrder}
                                                    showFakeData={showFakeData}
                                                    onEdit={() => {
                                                        setLessonToEdit(lesson);
                                                        setIsLessonFormModalOpen(
                                                            true
                                                        );
                                                    }}
                                                    onImport={() =>
                                                        console.log(
                                                            "Import lesson",
                                                            lesson.id
                                                        )
                                                    }
                                                    onComment={() => {
                                                        setLessonForComments(
                                                            lesson
                                                        );
                                                        setIsCommentsModalOpen(
                                                            true
                                                        );
                                                    }}
                                                    onMoveUp={() => {
                                                        if (index === 0) return;
                                                        const prev =
                                                            upcomingLessons[
                                                                index - 1
                                                            ];
                                                        orpc.lesson.patch
                                                            .call({
                                                                id: lesson.id,
                                                                order:
                                                                    (prev.order ??
                                                                        index) +
                                                                    0,
                                                            })
                                                            .then(() =>
                                                                orpc.lesson.patch.call(
                                                                    {
                                                                        id: prev.id,
                                                                        order: displayOrder,
                                                                    }
                                                                )
                                                            )
                                                            .then(() => {
                                                                queryClient.invalidateQueries(
                                                                    {
                                                                        queryKey:
                                                                            orpc.subject.getWithLessons.queryKey(
                                                                                {
                                                                                    input: {
                                                                                        id: subjectId,
                                                                                    },
                                                                                }
                                                                            ),
                                                                    }
                                                                );
                                                            });
                                                    }}
                                                    onMoveDown={() => {
                                                        if (
                                                            index ===
                                                            upcomingLessons.length -
                                                                1
                                                        )
                                                            return;
                                                        const next =
                                                            upcomingLessons[
                                                                index + 1
                                                            ];
                                                        orpc.lesson.patch
                                                            .call({
                                                                id: lesson.id,
                                                                order:
                                                                    (next.order ??
                                                                        index +
                                                                            2) -
                                                                    0,
                                                            })
                                                            .then(() =>
                                                                orpc.lesson.patch.call(
                                                                    {
                                                                        id: next.id,
                                                                        order: displayOrder,
                                                                    }
                                                                )
                                                            )
                                                            .then(() => {
                                                                queryClient.invalidateQueries(
                                                                    {
                                                                        queryKey:
                                                                            orpc.subject.getWithLessons.queryKey(
                                                                                {
                                                                                    input: {
                                                                                        id: subjectId,
                                                                                    },
                                                                                }
                                                                            ),
                                                                    }
                                                                );
                                                            });
                                                    }}
                                                    onDelete={() => {
                                                        setLessonToDelete(
                                                            lesson
                                                        );
                                                        setIsDeleteDialogOpen(
                                                            true
                                                        );
                                                    }}
                                                />
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="col-span-full lg:col-span-2 space-y-6">
                            {subjectData.description && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Description</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {subjectData.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Fichiers uploadés</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* TODO: Replace with actual files list when file upload is implemented */}
                                    <EmptyState
                                        title="Aucun fichier uploadé"
                                        description="Les fichiers que vous ajoutez à cette matière apparaîtront ici."
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Analyses et recommandations
                                    </CardTitle>
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
                </div>
            </div>

            <SubjectFormModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                initialData={
                    subjectData
                        ? {
                              id: subjectData.id,
                              name: subjectData.name,
                              description: subjectData.description ?? null,
                              type: subjectData.type,
                              category: subjectData.category,
                          }
                        : undefined
                }
            />

            {subjectId && (
                <LessonFormModal
                    open={isLessonFormModalOpen}
                    onOpenChange={setIsLessonFormModalOpen}
                    subjectId={subjectId}
                    initialData={
                        lessonToEdit
                            ? {
                                  id: lessonToEdit.id,
                                  label: lessonToEdit.label,
                                  description: lessonToEdit.description,
                                  duration: lessonToEdit.duration,
                                  status: lessonToEdit.status,
                                  scope: lessonToEdit.scope,
                              }
                            : undefined
                    }
                />
            )}

            {/* Comments modal */}
            {lessonForComments && (
                <LessonCommentsDialog
                    open={isCommentsModalOpen}
                    onOpenChange={(open: boolean) => {
                        setIsCommentsModalOpen(open);
                        if (!open) {
                            setLessonForComments(null);
                        }
                    }}
                    lesson={lessonForComments}
                    onSave={(comments) =>
                        updateLessonComments({
                            id: lessonForComments.id,
                            comments,
                        })
                    }
                />
            )}

            {/* Delete lesson confirmation */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open: boolean) => {
                    setIsDeleteDialogOpen(open);
                    if (!open) {
                        setLessonToDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer cette leçon ?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Cette action est définitive et supprimera la leçon{" "}
                        <span className="font-semibold">
                            {lessonToDelete?.label}
                        </span>{" "}
                        de cette matière. Les commentaires associés seront
                        également supprimés.
                    </p>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (lessonToDelete) {
                                    deleteLesson(lessonToDelete.id);
                                }
                            }}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

type LessonStatus = "done" | "to_review" | "in_progress" | "to_do";

function getLessonStatus(lesson: Lesson): LessonStatus {
    // Utilise le statut stocké depuis le backend
    return (lesson.status ?? "to_do") as LessonStatus;
}

function getStatusConfig(status: LessonStatus) {
    switch (status) {
        case "done":
            return {
                label: "Terminée",
                variant: "success" as const,
                icon: CheckCircle2,
            };
        case "in_progress":
            return {
                label: "En cours",
                variant: "default" as const,
                icon: PlayCircle,
            };
        case "to_review":
            return {
                label: "À revoir",
                variant: "outline" as const,
                icon: Circle,
            };
        case "to_do":
        default:
            return {
                label: "À faire",
                variant: "outline" as const,
                icon: Circle,
            };
    }
}

function LessonCard({
    lesson,
    estimatedTime,
    displayOrder,
    showFakeData = false,
    onEdit,
    onImport,
    onComment,
    onDelete,
    onMoveUp,
    onMoveDown,
}: {
    lesson: Lesson & { subject_name: string };
    estimatedTime: number;
    displayOrder: number;
    showFakeData?: boolean;
    onEdit: () => void;
    onImport: () => void;
    onComment: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    // Determine lesson status
    const status = getLessonStatus(lesson);
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    // Get scope configuration for colors
    const scope = lesson.scope ?? "core";
    const scopeConfig = getScopeConfig(scope);
    const scopeColors = {
        bg: scopeConfig.color,
        text: scopeConfig.iconColor,
        border: scopeConfig.borderColor,
    };

    // Fake data for design preview
    const hasFiles = showFakeData;
    const fakeFiles = [
        { name: "Cours_Chapitre_3.pdf", size: "2.4 MB" },
        { name: "Exercices_Complementaires.docx", size: "856 KB" },
    ];

    return (
        <div className="group flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/30">
            {/* Main content */}
            <div className="flex flex-col gap-4 lg:flex-row-reverse sm:items-start sm:justify-between">
                <div className="flex shrink-0 items-center gap-1">
                    <Badge variant={statusConfig.variant} className="text-xs">
                        <StatusIcon className="size-3" />
                        {statusConfig.label}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onMoveUp}
                        className="h-8 w-8"
                        title="Monter la leçon"
                    >
                        <ChevronUp className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onMoveDown}
                        className="h-8 w-8"
                        title="Descendre la leçon"
                    >
                        <ChevronDown className="size-4" />
                    </Button>
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
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onDelete}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Supprimer la leçon"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-3">
                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${scopeColors.bg} ${scopeColors.border}`}
                        >
                            <span
                                className={`text-lg font-semibold ${scopeColors.text}`}
                            >
                                {displayOrder}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground leading-tight">
                                    {lesson.label}
                                </h4>
                                <p
                                    className={`text-xs ${scopeColors.border} ${scopeColors.text} self-end`}
                                >
                                    {getScopeLabel(scope)}
                                </p>
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

interface LessonCommentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lesson: Lesson;
    onSave: (comments: { title: string; description: string }[]) => void;
}

function LessonCommentsDialog({
    open,
    onOpenChange,
    lesson,
    onSave,
}: LessonCommentsDialogProps) {
    const [comments, setComments] = useState<
        { id: number; title: string; description: string }[]
    >(
        (lesson.comments ?? []).map((comment, index) => ({
            id: index,
            title: comment.title,
            description: comment.description,
        }))
    );

    const handleAdd = () => {
        setComments((prev) => [
            ...prev,
            { id: Date.now(), title: "", description: "" },
        ]);
    };

    const handleChange = (
        id: number,
        field: "title" | "description",
        value: string
    ) => {
        setComments((prev) =>
            prev.map((comment) =>
                comment.id === id ? { ...comment, [field]: value } : comment
            )
        );
    };

    const handleDelete = (id: number) => {
        setComments((prev) => prev.filter((comment) => comment.id !== id));
    };

    const handleSave = () => {
        const filtered = comments.filter(
            (c) => c.title.trim().length > 0 || c.description.trim().length > 0
        );
        onSave(
            filtered.map(({ title, description }) => ({
                title,
                description,
            }))
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        Commentaires pour la leçon "{lesson.label}"
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {comments.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Aucun commentaire pour le moment. Ajoutez-en un pour
                            noter des idées, rappels ou consignes.
                        </p>
                    )}

                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="space-y-2 rounded-md border border-border/60 bg-muted/10 p-3"
                        >
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Titre du commentaire"
                                    value={comment.title}
                                    onChange={(e) =>
                                        handleChange(
                                            comment.id,
                                            "title",
                                            e.target.value
                                        )
                                    }
                                />
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(comment.id)}
                                    title="Supprimer le commentaire"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                            <Textarea
                                placeholder="Contenu du commentaire..."
                                value={comment.description}
                                onChange={(e) =>
                                    handleChange(
                                        comment.id,
                                        "description",
                                        e.target.value
                                    )
                                }
                                rows={3}
                            />
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAdd}
                    >
                        <Plus className="size-4 mr-2" />
                        Ajouter un commentaire
                    </Button>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Annuler
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
