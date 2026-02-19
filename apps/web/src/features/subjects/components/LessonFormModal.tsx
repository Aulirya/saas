import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";
import {
  Lesson,
  LessonCreateInput,
  LessonPatchInput,
  LessonStatus,
  LessonScope,
  LESSON_STATUSES,
  LESSON_SCOPES,
} from "shared";
import { getStatusConfig, getScopeConfig } from "@/lib/lesson-utils";

import { FormSheet } from "@/components/ui/form-sheet";
import { SheetClose } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";

import { TextField, TextareaField, SelectField } from "@/components/forms";

const lessonStatuses = LESSON_STATUSES as unknown as LessonStatus[];
const lessonScopes = LESSON_SCOPES as unknown as LessonScope[];

interface LessonFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  initialData?: Lesson;
}

export function LessonFormModal({
  open,
  onOpenChange,
  subjectId,
  initialData,
}: LessonFormModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData;

  // ---------- Mutations ----------
  const { mutate: createLesson } = useMutation({
    mutationFn: async (data: LessonCreateInput) => {
      return await orpc.lesson.create.call(data);
    },
    onSuccess: () => {
      handleSuccess("Leçon créée avec succès");
    },
    onError: (error) => {
      handleError(error, "Error creating lesson hehe:", error.message);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { mutate: updateLesson } = useMutation({
    mutationFn: async (data: LessonPatchInput) => {
      return await orpc.lesson.patch.call(data);
    },
    onSuccess: () => {
      handleSuccess("Leçon modifiée avec succès");
    },
    onError: (error) => {
      handleError(
        error,
        "Error updating lesson:",
        "Erreur lors de la modification de la leçon",
      );
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  function handleSuccess(message: string) {
    queryClient.invalidateQueries({
      queryKey: orpc.lesson.list.queryKey({}),
    });
    // Invalidate the subject with lessons query
    queryClient.invalidateQueries({
      queryKey: orpc.subject.getWithLessons.queryKey({
        input: { id: subjectId },
      }),
    });

    toast.success(message);
    form.reset();
    onOpenChange(false);
  }

  function handleError(error: any, contextMsg: string, toastMsg: string) {
    console.error(contextMsg, error);
    toast.error(toastMsg);
  }

  // ---------- Form ----------
  const form = useForm({
    defaultValues: {
      description: initialData?.description ?? "",
      label: initialData?.label ?? "",
      duration: initialData?.duration ?? 60,
      status: (initialData?.status ?? "to_do") as LessonStatus,
      scope: (initialData?.scope ?? "core") as LessonScope,
    },

    onSubmit: async ({ value }) => {
      setIsSubmitting(true);

      if (isEditMode && initialData) {
        // Check if there are any changes
        if (
          JSON.stringify(initialData) ===
          JSON.stringify({
            id: initialData.id,
            subject_id: subjectId,
            ...value,
          })
        ) {
          toast.info("Aucune modification détectée");
          setIsSubmitting(false);
          return;
        }

        updateLesson({
          id: initialData.id,
          subject_id: subjectId,
          description: value.description || undefined,
          label: value.label,
          duration: value.duration,
          status: value.status,
          scope: value.scope,
        });
      } else {
        createLesson({
          subject_id: subjectId,
          description: value.description || "",
          label: value.label,
          duration: value.duration,
          status: value.status,
          scope: value.scope,
        });
      }
    },
  });

  // ---------- Helper functions ----------
  const handleClose = (shouldClose: boolean) => {
    if (shouldClose && !isSubmitting) {
      form.reset();
    }
    onOpenChange(shouldClose);
  };

  const getStatusLabel = (status: LessonStatus): string => {
    return getStatusConfig(status).label;
  };

  const getScopeLabel = (scope: LessonScope): string => {
    return getScopeConfig(scope).label;
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Modifier la leçon" : "Créer une nouvelle leçon"}
      children={
        <form
          id="create-lesson-form"
          className="overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            {/* Lesson Label */}
            <form.Field
              name="label"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Le titre est requis";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <TextField
                    field={field}
                    label="Titre"
                    placeholder="Titre de la leçon"
                    aria-invalid={isInvalid}
                    required
                  />
                );
              }}
            />

            {/* Description */}
            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <TextareaField
                    field={field}
                    label="Description"
                    placeholder="Description de la leçon..."
                    aria-invalid={isInvalid}
                    rows={4}
                  />
                );
              }}
            />

            {/* Status */}
            <form.Field
              name="status"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <SelectField
                    field={field}
                    label="Statut"
                    placeholder="Sélectionnez un statut"
                    aria-invalid={isInvalid}
                    options={lessonStatuses}
                    getLabel={getStatusLabel}
                  />
                );
              }}
            />

            {/* Scope */}
            <form.Field
              name="scope"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <SelectField
                    field={field}
                    label="Portée"
                    placeholder="Sélectionnez une portée"
                    aria-invalid={isInvalid}
                    options={lessonScopes}
                    getLabel={getScopeLabel}
                  />
                );
              }}
            />

            {/* Duration */}
            <form.Field
              name="duration"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value <= 0) {
                    return "La durée doit être supérieure à 0";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Durée (en minutes)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="1"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value, 10))
                      }
                      onBlur={field.handleBlur}
                      placeholder="60"
                      aria-invalid={isInvalid}
                      required
                    />
                    <FieldError>
                      {field.state.meta.errors?.map(
                        (error: unknown, index: number) => (
                          <span key={index}>
                            {typeof error === "string"
                              ? error
                              : "Erreur de validation"}
                          </span>
                        ),
                      )}
                    </FieldError>
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <SheetClose asChild>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <>
                  <Button
                    variant="outline"
                    type="reset"
                    onClick={(e) => {
                      handleClose(false);
                      e.preventDefault();
                      form.reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>

                  <Button
                    type="submit"
                    form="create-lesson-form"
                    disabled={!canSubmit || !form.state.isValid}
                  >
                    {isSubmitting
                      ? isEditMode
                        ? "Modification..."
                        : "Création..."
                      : isEditMode
                        ? "Modifier la leçon"
                        : "Créer la leçon"}
                  </Button>
                </>
              )}
            />
          </SheetClose>
        </div>
      }
    />
  );
}
