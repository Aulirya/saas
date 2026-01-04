import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";
import { SUBJECT_CATEGORIES, SubjectCategory } from "@saas/shared";
import { getCategoryLabel } from "@/lib/subject-category";

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
import { subject_create_input, type SubjectCreateInput } from "@saas/shared";

// Default subject types (can be supplemented by database values)
const defaultSubjectTypes = ["core", "option", "support"] as const;

// Subject categories matching the database enum
const subjectCategories = SUBJECT_CATEGORIES as unknown as SubjectCategory[];

interface SubjectFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: {
        id: string;
        name: string;
        description?: string | null;
        type: "core" | "option" | "support" | null;
        category: string;
    };
}

export function SubjectFormModal({
    open,
    onOpenChange,
    initialData,
}: SubjectFormModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialData;

    const form = useForm({
        defaultValues: {
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
            type: initialData?.type ?? "",
            category: initialData?.category ?? "",
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
                    return "Veuillez corriger les erreurs dans le formulaire";
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
                    type: value.type as "core" | "option" | "support",
                    category: value.category as SubjectCategory,
                });
            } else {
                createSubject({
                    name: value.name,
                    description: value.description || null,
                    type: value.type as
                        | "core"
                        | "option"
                        | "support"
                        | undefined,
                    category: value.category as SubjectCategory,
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
            form.setFieldValue("category", initialData.category);
        } else if (open && !initialData) {
            // Reset to empty values when opening for create
            form.reset();
        }
    }, [open, initialData, form]);

    // Helper function to extract error message from orpc errors
    const extractErrorMessage = (error: unknown): string => {
        console.log("Full error object:", error);
        console.log("Error type:", typeof error);
        console.log("Error constructor:", error?.constructor?.name);

        // Handle ORPCError structure (has code and data properties)
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            "data" in error &&
            error.data &&
            typeof error.data === "object" &&
            "message" in error.data &&
            typeof error.data.message === "string"
        ) {
            console.log(
                "Found ORPCError with data.message:",
                error.data.message
            );
            return error.data.message;
        }

        // Handle Error objects
        if (error instanceof Error) {
            console.log("Found Error object with message:", error.message);
            return error.message;
        }

        // Handle orpc error structure (may have data.message without code)
        if (
            error &&
            typeof error === "object" &&
            "data" in error &&
            error.data &&
            typeof error.data === "object" &&
            "message" in error.data &&
            typeof error.data.message === "string"
        ) {
            console.log("Found error with data.message:", error.data.message);
            return error.data.message;
        }

        // Handle objects with direct message property
        if (
            error &&
            typeof error === "object" &&
            "message" in error &&
            typeof error.message === "string"
        ) {
            console.log("Found error with direct message:", error.message);
            return error.message;
        }

        // Fallback
        console.log("Using fallback error message");
        return "Une erreur est survenue";
    };

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
            const errorMsg = extractErrorMessage(error);
            toast.error(errorMsg);
            toast(errorMsg, {
                description: errorMsg,
                action: {
                    label: "Fermer",
                    onClick: () => handleClose(false),
                },
            });
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
            // Invalidate all related queries to refresh the lists
            queryClient.invalidateQueries({ queryKey: ["subjects"] });
            queryClient.invalidateQueries({
                queryKey: orpc.subject.list.queryKey({}),
            });
            toast.success(successMessage);
            form.reset();
            onOpenChange(false);
        },
        onError: (error: unknown) => {
            console.error("Error in create subject:", errorMessage, error);
            const errorMsg = extractErrorMessage(error);
            console.log("Extracted error message:", errorMsg);
            toast.error(errorMsg);
            // Check if it's a duplicate name error
            if (
                errorMsg.includes("existe déjà") ||
                errorMsg.includes("already exists")
            ) {
                // Set the error on the name field
                form.setFieldMeta("name", (meta) => ({
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

    const { mutate: createSubject } = useMutation({
        mutationFn: async (data: Omit<SubjectCreateInput, "user_id">) => {
            const result = await orpc.subject.create.call(
                data as unknown as Parameters<
                    typeof orpc.subject.create.call
                >[0]
            );
            console.log("Result of subject.create:", result);
            return result;
        },
        ...getCreateMutationHandlers(
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
            category: SubjectCategory;
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
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value || value.trim().length === 0) {
                                        return "Le nom est requis";
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
                                            Nom de la matière
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
                                                        "name",
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
                                            placeholder="Nom de la matière"
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

                        {/* Category */}
                        <form.Field
                            name="category"
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value) {
                                        return "La catégorie est requise";
                                    }
                                    if (
                                        !subjectCategories.includes(
                                            value as SubjectCategory
                                        )
                                    ) {
                                        return "Catégorie invalide";
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
                                            Catégorie
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
                                                <SelectValue placeholder="Sélectionnez une catégorie" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjectCategories.map(
                                                    (category) => (
                                                        <SelectItem
                                                            key={category}
                                                            value={category}
                                                        >
                                                            {getCategoryLabel(
                                                                category
                                                            )}
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
                                    {canSubmit ? "true" : "false"}{" "}
                                    {form.state.isValid ? "true" : "false"}
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
