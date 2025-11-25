import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";

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
import { subject_create_input } from "@saas/shared";

// Default subject types (can be supplemented by database values)
const defaultSubjectTypes = [
    "Mathématiques",
    "Français",
    "Anglais",
    "Histoire",
    "Géographie",
    "Sciences",
    "Physique",
    "Chimie",
    "Biologie",
    "Philosophie",
    "Économie",
    "Arts",
    "Sport",
    "Autre",
] as const;

interface CreateSubjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: {
        id: string;
        name: string;
        description?: string | null;
        type: string;
        total_hours: number;
        hours_per_week: number;
    };
}

export function CreateSubjectModal({
    open,
    onOpenChange,
    initialData,
}: CreateSubjectModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialData;

    const form = useForm({
        defaultValues: {
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
            type: initialData?.type ?? "",
            total_hours: initialData?.total_hours ?? 0,
            hours_per_week: initialData?.hours_per_week ?? 0,
        },
        validators: {
            onSubmit: ({ value }) => {
                const transformedValue = {
                    ...value,
                    description:
                        value.description && value.description.trim().length > 0
                            ? value.description
                            : null,
                };
                const result = subject_create_input.safeParse(transformedValue);

                if (!result.success) {
                    return result.error.format();
                }
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            if (isEditMode && initialData) {
                updateSubject({
                    id: initialData.id,
                    name: value.name,
                    description: value.description || null,
                    type: value.type,
                    total_hours: value.total_hours,
                    hours_per_week: value.hours_per_week,
                });
            } else {
                createSubject({
                    name: value.name,
                    description: value.description || null,
                    type: value.type,
                    total_hours: value.total_hours,
                    hours_per_week: value.hours_per_week,
                });
            }
        },
    });

    // Reset form when initialData changes (when modal opens with edit data)
    useEffect(() => {
        if (open && initialData) {
            form.setFieldValue("name", initialData.name);
            form.setFieldValue("description", initialData.description ?? "");
            form.setFieldValue("type", initialData.type);
            form.setFieldValue("total_hours", initialData.total_hours);
            form.setFieldValue("hours_per_week", initialData.hours_per_week);
        } else if (open && !initialData) {
            // Reset to empty values when opening for create
            form.reset();
        }
    }, [open, initialData, form]);

    // Shared mutation handlers
    const getMutationHandlers = (
        errorMessage: string,
        successMessage: string
    ) => ({
        onSuccess: () => {
            // Invalidate all related queries to refresh the lists
            queryClient.invalidateQueries({ queryKey: ["subjects"] });
            queryClient.invalidateQueries({
                queryKey: orpc.subject.list.queryKey({}),
            });
            if (initialData?.id) {
                queryClient.invalidateQueries({
                    queryKey: orpc.subject.getWithLessons.queryKey({
                        input: { id: initialData.id },
                    }),
                });
            }
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

    const { mutate: createSubject } = useMutation({
        mutationFn: async (data: {
            name: string;
            description?: string | null;
            type: string;
            total_hours: number;
            hours_per_week: number;
        }) => {
            return await orpc.subject.create.call(data);
        },
        ...getMutationHandlers(
            "Error creating subject:",
            "Matière créée avec succès"
        ),
    });

    const { mutate: updateSubject } = useMutation({
        mutationFn: async (data: {
            id: string;
            name: string;
            description?: string | null;
            type: string;
            total_hours: number;
            hours_per_week: number;
        }) => {
            return await orpc.subject.patch.call(data);
        },
        ...getMutationHandlers(
            "Error updating subject:",
            "Matière modifiée avec succès"
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
                isEditMode
                    ? "Modifier la matière"
                    : "Créer une nouvelle matière"
            }
            children={
                <form
                    id="create-subject-form"
                    className="overflow-y-auto"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        {/* Subject Name */}
                        <form.Field
                            name="name"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Nom de la matière
                                        </FieldLabel>

                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="Ex: Mathématiques"
                                            aria-invalid={isInvalid}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : (error &&
                                                              typeof error ===
                                                                  "object" &&
                                                              "message" in error
                                                                  ? String(
                                                                        (
                                                                            error as {
                                                                                message?: unknown;
                                                                            }
                                                                        )
                                                                            .message
                                                                    )
                                                                  : "Erreur de validation") ||
                                                              "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
                                );
                            }}
                        />

                        {/* Subject Type */}
                        <form.Field
                            name="type"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Type
                                        </FieldLabel>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(value) => {
                                                field.handleChange(value);
                                                field.handleBlur();
                                            }}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                aria-invalid={isInvalid}
                                            >
                                                <SelectValue placeholder="Sélectionnez un type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {defaultSubjectTypes.map(
                                                    (type) => (
                                                        <SelectItem
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {type}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : (error &&
                                                              typeof error ===
                                                                  "object" &&
                                                              "message" in error
                                                                  ? String(
                                                                        (
                                                                            error as {
                                                                                message?: unknown;
                                                                            }
                                                                        )
                                                                            .message
                                                                    )
                                                                  : "Erreur de validation") ||
                                                              "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
                                );
                            }}
                        />

                        {/* Description */}
                        <form.Field
                            name="description"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Description (optionnel)
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
                                            placeholder="Description de la matière..."
                                            aria-invalid={isInvalid}
                                            rows={3}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : (error &&
                                                              typeof error ===
                                                                  "object" &&
                                                              "message" in error
                                                                  ? String(
                                                                        (
                                                                            error as {
                                                                                message?: unknown;
                                                                            }
                                                                        )
                                                                            .message
                                                                    )
                                                                  : "Erreur de validation") ||
                                                              "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
                                );
                            }}
                        />

                        {/* Hours Per Week */}
                        <form.Field
                            name="hours_per_week"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Heures par semaine
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={
                                                field.state.value === 0
                                                    ? ""
                                                    : field.state.value
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.handleChange(
                                                    value === ""
                                                        ? 0
                                                        : parseFloat(value)
                                                );
                                            }}
                                            onBlur={field.handleBlur}
                                            placeholder="Ex: 4"
                                            aria-invalid={isInvalid}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : (error &&
                                                              typeof error ===
                                                                  "object" &&
                                                              "message" in error
                                                                  ? String(
                                                                        (
                                                                            error as {
                                                                                message?: unknown;
                                                                            }
                                                                        )
                                                                            .message
                                                                    )
                                                                  : "Erreur de validation") ||
                                                              "Erreur de validation"}
                                                    </span>
                                                )
                                            )}
                                        </FieldError>
                                    </Field>
                                );
                            }}
                        />

                        {/* Total Hours */}
                        <form.Field
                            name="total_hours"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Heures totales
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={
                                                field.state.value === 0
                                                    ? ""
                                                    : field.state.value
                                            }
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.handleChange(
                                                    value === ""
                                                        ? 0
                                                        : parseFloat(value)
                                                );
                                            }}
                                            onBlur={field.handleBlur}
                                            placeholder="Ex: 120"
                                            aria-invalid={isInvalid}
                                        />
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (error, index) => (
                                                    <span key={index}>
                                                        {typeof error ===
                                                        "string"
                                                            ? error
                                                            : (error &&
                                                              typeof error ===
                                                                  "object" &&
                                                              "message" in error
                                                                  ? String(
                                                                        (
                                                                            error as {
                                                                                message?: unknown;
                                                                            }
                                                                        )
                                                                            .message
                                                                    )
                                                                  : "Erreur de validation") ||
                                                              "Erreur de validation"}
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
                                        form="create-subject-form"
                                        disabled={
                                            !canSubmit || !form.state.isValid
                                        }
                                    >
                                        {isSubmitting
                                            ? isEditMode
                                                ? "Modification..."
                                                : "Création..."
                                            : isEditMode
                                            ? "Modifier la matière"
                                            : "Créer la matière"}
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
