import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Download, Edit, Plus } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubjectWithLessons } from "@/features/subjects/api/useSubjects";
import { useLessons } from "@/features/subjects/api/useLessons";
import { SubjectFormModal } from "@/features/subjects/components/SubjectFormModal";
import { LessonFormModal } from "@/features/subjects/components/LessonFormModal";
import { LessonCard } from "@/features/subjects/components/LessonCard";
import { LessonCommentsDialog } from "@/features/subjects/components/LessonCommentsDialog";
import type { EmptyStateProps } from "@/types/class.types";
import type { Lesson } from "shared";
import { getCategoryLabel, getCategoryConfig } from "@/lib/subject-utils";

export const Route = createFileRoute("/_protected/subjects/$subjectId")({
  component: SubjectDetailPage,
});

function SubjectDetailPage() {
  const { subjectId } = Route.useParams();
  const navigate = Route.useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLessonFormModalOpen, setIsLessonFormModalOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<
    (Lesson & { subject_name: string }) | null
  >(null);
  const [lessonForComments, setLessonForComments] = useState<Lesson | null>(
    null,
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

  const {
    updateLessonComments: updateLessonCommentsMutation,
    deleteLesson: deleteLessonMutation,
    updateLessonStatus,
    reorderLesson,
  } = useLessons({ subjectId: subjectId ?? undefined });

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

  // Wrapper to handle modal state management for comments update
  const updateLessonComments = (params: {
    id: string;
    comments: { title: string; description: string }[];
  }) => {
    updateLessonCommentsMutation(params, {
      onSuccess: () => {
        setIsCommentsModalOpen(false);
        setLessonForComments(null);
      },
    });
  };

  // Wrapper to handle modal state management for delete
  const deleteLesson = (params: {
    id: string;
    order: number;
    subjectId: string;
  }) => {
    deleteLessonMutation(
      {
        id: params.id,
        order: params.order ?? (null as number | null),
        subject_id: params.subjectId,
      },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setLessonToDelete(null);
        },
      },
    );
  };

  // Handle file import
  const handleImportFiles = (lessonId: string) => {
    // Create a new file input for each import action to allow multiple selections
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "*/*"; // Accept all file types
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        console.log(
          `Import ${files.length} file(s) for lesson ${lessonId}:`,
          files,
        );
        // TODO: Implement file upload logic here
        // You can process the files and upload them to your backend
      }
    };
    input.click();
  };

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
              const categoryConfig = getCategoryConfig(subjectData.category);
              return (
                <DetailMetric
                  label="Catégorie"
                  value={getCategoryLabel(subjectData.category)}
                  icon={categoryConfig.icon}
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
                      return (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          estimatedTime={lesson.duration}
                          displayOrder={lesson.order ?? 0}
                          _showFakeData={index === 0}
                          onEdit={() => {
                            setLessonToEdit(lesson);
                            setIsLessonFormModalOpen(true);
                          }}
                          onImport={() => handleImportFiles(lesson.id)}
                          onComment={() => {
                            setLessonForComments(lesson);
                            setIsCommentsModalOpen(true);
                          }}
                          onMoveUp={() => {
                            if (index === 0) return;
                            reorderLesson({
                              lesson_id: lesson.id,
                              target_lesson_id: upcomingLessons[index - 1].id,
                              subject_id: subjectId ?? "",
                            });
                          }}
                          onMoveDown={() => {
                            if (index === upcomingLessons.length - 1) return;
                            reorderLesson({
                              lesson_id: lesson.id,
                              target_lesson_id: upcomingLessons[index + 1].id,
                              subject_id: subjectId ?? "",
                            });
                          }}
                          onDelete={() => {
                            setLessonToDelete(lesson);
                            setIsDeleteDialogOpen(true);
                          }}
                          onStatusChange={(status) => {
                            updateLessonStatus({
                              id: lesson.id,
                              status,
                            });
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
                  <CardTitle>Analyses et recommandations</CardTitle>
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
          initialData={lessonToEdit ?? undefined}
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
            <span className="font-semibold">{lessonToDelete?.label}</span> de
            cette matière. Les commentaires associés seront également supprimés.
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
              className="bg-destructive  hover:bg-destructive/90"
              onClick={() => {
                if (lessonToDelete) {
                  deleteLesson({
                    id: lessonToDelete.id,
                    order: lessonToDelete.order ?? (0 as number),
                    subjectId: subjectId ?? "",
                  });
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

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6">
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
