import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";
import { lesson_create_input } from "@saas/shared";

import { FormSheet } from "@/components/ui/form-sheet";
import { SheetClose } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateLessonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjectId: string;
    initialData?: {
        id: string;
        label: string;
        description: string;
        duration: number;
        status: "done" | "to_review" | "in_progress" | "to_do";
        scope: "core" | "bonus" | "optional";
    };
}

export function CreateLessonModal({
    open,
    onOpenChange,
    subjectId,
    initialData,
}: CreateLessonModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialData;

    const form = useForm({
        defaultValues: {
            description: initialData?.description ?? "",
            label: initialData?.label ?? "",
            duration: initialData?.duration ?? 60,
            status: initialData?.status ?? "to_do",
            scope: initialData?.scope ?? "core",
        },
        validators: {
            onSubmit: ({ value }) => {
                const transformedValue = {
                    subject_id: subjectId,
                    description: value.description,
                    label: value.label,
                    duration: value.duration,
                    status: value.status,
                    scope: value.scope,
                };
                const result = lesson_create_input.safeParse(transformedValue);

                if (!result.success) {
                    return "Veuillez corriger les erreurs dans le formulaire";
                }

                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);

            const lessonData = {
                subject_id: subjectId,
                description: value.description,
                label: value.label,
                duration: value.duration,
                status: value.status,
                scope: value.scope,
            };

            if (isEditMode && initialData) {
                updateLesson({
                    id: initialData.id,
                    ...lessonData,
                });
            } else {
                createLesson(lessonData);
            }
        },
    });

    // Reset form when initialData changes
    useEffect(() => {
        if (open && initialData) {
            form.setFieldValue("description", initialData.description);
            form.setFieldValue("label", initialData.label);
            form.setFieldValue("duration", initialData.duration);
            form.setFieldValue("status", initialData.status);
            form.setFieldValue("scope", initialData.scope);
        } else if (open && !initialData) {
            form.reset();
        }
    }, [open, initialData, form]);

    // Shared mutation handlers
    const getMutationHandlers = (
        errorMessage: string,
        successMessage: string
    ) => ({
        onSuccess: () => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ["lessons"] });
            queryClient.invalidateQueries({
                queryKey: orpc.lesson.list.queryKey({}),
            });
            queryClient.invalidateQueries({
                queryKey: orpc.subject.getWithLessons.queryKey({
                    input: { id: subjectId },
                }),
            });
            toast.success(successMessage);
            form.reset();
            onOpenChange(false);
        },
        onError: (error: unknown) => {
            console.error(errorMessage, error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";
            toast.error(errorMsg);
            setIsSubmitting(false);
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    // Special handler for create that handles duplicate name errors
    const getCreateMutationHandlers = (
        errorMessage: string,
        successMessage: string
    ) => ({
        onSuccess: () => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ["lessons"] });
            queryClient.invalidateQueries({
                queryKey: orpc.lesson.list.queryKey({}),
            });
            queryClient.invalidateQueries({
                queryKey: orpc.subject.getWithLessons.queryKey({
                    input: { id: subjectId },
                }),
            });
            toast.success(successMessage);
            form.reset();
            onOpenChange(false);
        },
        onError: (error: unknown) => {
            console.error(errorMessage, error);
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue";

            // Check if it's a duplicate name error
            if (
                errorMsg.includes("existe déjà") ||
                errorMsg.includes("already exists")
            ) {
                // Set the error on the label field
                form.setFieldMeta("label", (meta) => ({
                    ...meta,
                    errors: [errorMsg],
                    isTouched: true,
                }));
                // Don't show toast, keep form open
            } else {
                // For other errors, show toast
                toast.error(errorMsg);
            }
            setIsSubmitting(false);
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    const { mutate: createLesson } = useMutation({
        mutationFn: async (data: {
            subject_id: string;
            description: string;
            label: string;
            duration: number;
            status: "done" | "to_review" | "in_progress" | "to_do";
            scope: "core" | "bonus" | "optional";
        }) => {
            return await orpc.lesson.create.call(data);
        },
        ...getCreateMutationHandlers(
            "Error creating lesson:",
            "Leçon créée avec succès"
        ),
    });

    const { mutate: updateLesson } = useMutation({
        mutationFn: async (data: {
            id: string;
            subject_id: string;
            description: string;
            label: string;
            duration: number;
            status: "done" | "to_review" | "in_progress" | "to_do";
            scope: "core" | "bonus" | "optional";
        }) => {
            return await orpc.lesson.patch.call({
                id: data.id,
                subject_id: data.subject_id,
                description: data.description,
                label: data.label,
                duration: data.duration,
                status: data.status,
                scope: data.scope,
            });
        },
        ...getMutationHandlers(
            "Error updating lesson:",
            "Leçon modifiée avec succès"
        ),
    });

    const handleClose = (shouldClose: boolean) => {
        if (shouldClose && !isSubmitting) {
            form.reset();
        }
        onOpenChange(shouldClose);
    };

    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditMode ? "Modifier la leçon" : "Créer une nouvelle leçon"
            }
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
                        {/* Lesson Label - Mandatory */}
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
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Titre
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => {
                                                field.handleChange(
                                                    e.target.value
                                                );
                                                // Clear server-side duplicate name errors when user starts typing
                                                const errors =
                                                    field.state.meta.errors ??
                                                    [];
                                                const hasServerError =
                                                    errors.some(
                                                        (error: unknown) =>
                                                            typeof error ===
                                                                "string" &&
                                                            (error.includes(
                                                                "existe déjà"
                                                            ) ||
                                                                error.includes(
                                                                    "already exists"
                                                                ))
                                                    );
                                                if (hasServerError) {
                                                    // Clear only server errors using form instance
                                                    form.setFieldMeta(
                                                        "label",
                                                        (meta: any) => {
                                                            const currentErrors =
                                                                (meta.errors as unknown[]) ??
                                                                [];
                                                            return {
                                                                ...meta,
                                                                errors: currentErrors.filter(
                                                                    (
                                                                        error: unknown
                                                                    ) =>
                                                                        typeof error !==
                                                                            "string" ||
                                                                        (!error.includes(
                                                                            "existe déjà"
                                                                        ) &&
                                                                            !error.includes(
                                                                                "already exists"
                                                                            ))
                                                                ),
                                                            };
                                                        }
                                                    );
                                                }
                                            }}
                                            onBlur={field.handleBlur}
                                            placeholder="Titre de la leçon"
                                            aria-invalid={isInvalid}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
                                );
                            }}
                        />

                        {/* Description (optionnelle) */}
                        <form.Field
                            name="description"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    field.state.meta.errors.length > 0;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Description
                                        </FieldLabel>
                                        <Textarea
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="Description de la leçon..."
                                            aria-invalid={isInvalid}
                                            rows={4}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
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
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Statut
                                        </FieldLabel>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(value) => {
                                                field.handleChange(
                                                    value as typeof field.state.value
                                                );
                                                field.handleBlur();
                                            }}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                aria-invalid={isInvalid}
                                            >
                                                <SelectValue placeholder="Sélectionnez un statut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="to_do">
                                                    À faire
                                                </SelectItem>
                                                <SelectItem value="in_progress">
                                                    En cours
                                                </SelectItem>
                                                <SelectItem value="to_review">
                                                    À revoir
                                                </SelectItem>
                                                <SelectItem value="done">
                                                    Terminée
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
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
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Portée
                                        </FieldLabel>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(value) => {
                                                field.handleChange(
                                                    value as typeof field.state.value
                                                );
                                                field.handleBlur();
                                            }}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                aria-invalid={isInvalid}
                                            >
                                                <SelectValue placeholder="Sélectionnez une portée" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="core">
                                                    Tronc commun
                                                </SelectItem>
                                                <SelectItem value="bonus">
                                                    Bonus
                                                </SelectItem>
                                                <SelectItem value="optional">
                                                    Optionnel
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
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
                                                field.handleChange(
                                                    parseInt(
                                                        e.target.value,
                                                        10
                                                    ) || 60
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="60"
                                            aria-invalid={isInvalid}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : "Erreur de validation"}
                                                    </span>
                                                )
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
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
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
                                        disabled={
                                            !canSubmit || !form.state.isValid
                                        }
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
