import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";
import {
    SUBJECT_CATEGORIES,
    SUBJECT_TYPES,
    SubjectCategory,
    SubjectType,
    Subject,
    SubjectCreateInput,
    SubjectPatchInput,
} from "@saas/shared";
import { getCategoryLabel, getSubjectTypeLabel } from "@/lib/subject-utils";

import { FormSheet } from "@/components/ui/form-sheet";
import { SheetClose } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    SelectFieldWithClear,
    SelectField,
    TextareaField,
    TextField,
} from "@/components/forms";

// Subject categories and types matching the database enum
const subjectCategories = SUBJECT_CATEGORIES as unknown as SubjectCategory[];
const subjectTypes = SUBJECT_TYPES as unknown as SubjectType[];

interface SubjectFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Subject;
}

export function SubjectFormModal({
    open,
    onOpenChange,
    initialData,
}: SubjectFormModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState<{
        type: "create" | "update";
        data: any;
    } | null>(null);
    const isEditMode = !!initialData;

    async function checkNameExists(name: string) {
        const checkResult = await orpc.subject.checkNameExists.call({
            name,
        });
        return checkResult.exists;
    }

    // ---------- Mutations ----------
    const { mutate: createSubject } = useMutation({
        mutationFn: async (data: SubjectCreateInput) => {
            return await orpc.subject.create.call(data);
        },
        onSuccess: () => {
            handleSuccess("Matière créée avec succès");
        },
        onError: (error) => {
            handleError(
                error,
                "Error creating subject:",
                "Erreur lors de la création de la matière"
            );
        },
    });

    const { mutate: updateSubject } = useMutation({
        mutationFn: async (data: SubjectPatchInput) => {
            return await orpc.subject.patch.call(data);
        },
        onSuccess: () => {
            handleSuccess("Matière modifiée avec succès");
        },
        onError: (error) => {
            handleError(
                error,
                "Error updating subject:",
                "Erreur lors de la modification de la matière"
            );
        },
    });

    function handleSuccess(message: string) {
        // Invalidate the subjects list
        queryClient.invalidateQueries({
            queryKey: orpc.subject.list.queryKey({}),
        });

        // If editing, invalidate the specific subject queries
        if (isEditMode && initialData?.id) {
            queryClient.invalidateQueries({
                queryKey: orpc.subject.getWithLessons.queryKey({
                    input: { id: initialData.id },
                }),
            });
        }

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
            name: initialData?.name ?? "",
            description: initialData?.description ?? "",
            type: initialData?.type ?? "",
            category: initialData?.category ?? "",
        },

        onSubmit: async ({ value }) => {
            setIsSubmitting(true);

            // Check if a subject with the same name already exists
            if (isEditMode && initialData?.name !== value.name) {
                try {
                    const checkResult = await checkNameExists(value.name);

                    if (checkResult) {
                        // Show warning modal
                        setPendingSubmit({
                            type: isEditMode ? "update" : "create",
                            data:
                                isEditMode && initialData
                                    ? {
                                          id: initialData.id,
                                          name: value.name,
                                          description:
                                              value.description || null,
                                          type: value.type,
                                          category:
                                              value.category as SubjectCategory,
                                      }
                                    : {
                                          name: value.name,
                                          description:
                                              value.description || null,
                                          type: value.type,
                                          category:
                                              value.category as SubjectCategory,
                                      },
                        });
                        setShowDuplicateWarning(true);
                        setIsSubmitting(false);
                        return;
                    }
                } catch (error) {
                    console.error("Error checking subject name:", error);
                    // Continue with submission if check fails (backend will validate)
                }
            }

            // No duplicate found, proceed with submission
            proceedWithSubmission(value);
        },
    });

    // Helper function to proceed with submission after confirmation
    const proceedWithSubmission = async (value: {
        id?: string;
        name: string;
        description?: string;
        type?: string;
        category: string;
    }) => {
        setIsSubmitting(true);

        if (isEditMode && initialData) {
            if (
                JSON.stringify(initialData) ===
                JSON.stringify({ id: initialData.id, ...value })
            ) {
                toast.info("Aucune modification détectée");
                setIsSubmitting(false);
                return;
            }

            value.id = initialData?.id;
            updateSubject(value as SubjectPatchInput);
        } else {
            createSubject(value as SubjectCreateInput);
        }
    };

    // Handle confirmation from duplicate warning modal
    const handleConfirmDuplicate = () => {
        if (pendingSubmit) {
            setShowDuplicateWarning(false);
            if (pendingSubmit.type === "update") {
                updateSubject(pendingSubmit.data);
            } else {
                createSubject(pendingSubmit.data);
            }
            setPendingSubmit(null);
        }
    };

    // Handle cancellation from duplicate warning modal
    const handleCancelDuplicate = () => {
        setShowDuplicateWarning(false);
        setPendingSubmit(null);
        setIsSubmitting(false);
    };

    const handleClose = (shouldClose: boolean) => {
        if (shouldClose && !isSubmitting) {
            form.reset();
        }
        onOpenChange(shouldClose);
    };

    return (
        <>
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
                                        if (
                                            !value ||
                                            value.trim().length === 0
                                        ) {
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
                                        <TextField
                                            field={field}
                                            label="Intitulé"
                                            placeholder="Intitulé de la matière"
                                            aria-invalid={isInvalid}
                                        />
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
                                        <SelectFieldWithClear
                                            field={field}
                                            label="Type"
                                            placeholder="Type de la matière"
                                            aria-invalid={isInvalid}
                                            options={subjectTypes}
                                            getLabel={getSubjectTypeLabel}
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
                                        !field.state.meta.isValid;

                                    return (
                                        <TextareaField
                                            field={field}
                                            label="Description"
                                            placeholder="Description de la matière"
                                            aria-invalid={isInvalid}
                                        />
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
                                        <SelectField
                                            field={field}
                                            label="Catégorie"
                                            placeholder="Sélectionnez une catégorie"
                                            aria-invalid={isInvalid}
                                            options={subjectCategories}
                                            getLabel={getCategoryLabel}
                                        />
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
                                                !canSubmit ||
                                                !form.state.isValid
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

            {/* Duplicate Warning Dialog */}
            <Dialog
                open={showDuplicateWarning}
                onOpenChange={setShowDuplicateWarning}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Matière existante</DialogTitle>
                        <DialogDescription>
                            Une matière avec le nom "{pendingSubmit?.data.name}"
                            existe déjà. Êtes-vous sûr de vouloir continuer ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelDuplicate}
                        >
                            Annuler
                        </Button>
                        <Button onClick={handleConfirmDuplicate}>
                            Continuer quand même
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
