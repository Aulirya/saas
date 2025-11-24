import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { school_class_create_input } from "@saas/shared";
import {
    useSchools,
    useSubjects,
} from "@/features/classes/api/useSchoolClasses";

// Default levels for French education system (can be supplemented by database values)
const defaultClassLevels = [
    "1ère secondaire",
    "2ème secondaire",
    "3ème secondaire",
    "4ème secondaire",
    "5ème secondaire",
    "6ème secondaire",
    "1ère primaire",
    "2ème primaire",
    "3ème primaire",
    "4ème primaire",
    "5ème primaire",
    "6ème primaire",
] as const;

interface CreateClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: {
        id: string;
        name: string;
        level: string;
        school: string;
        students_count: number;
        subjects?: string[];
    };
}

export function CreateClassModal({
    open,
    onOpenChange,
    initialData,
}: CreateClassModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialData;

    // Fetch existing schools and levels from database
    const { data: existingSchools = [] } = useSchools();
    const { data: availableSubjects = [] } = useSubjects();

    const form = useForm({
        defaultValues: {
            name: initialData?.name ?? "",
            level: initialData?.level ?? "",
            school: initialData?.school ?? "",
            students_count: initialData?.students_count ?? 0,
            subjects: initialData?.subjects ?? ([] as string[]),
        },
        validators: {
            onSubmit: ({ value }) => {
                // Transform form value to match schema (subjects is optional in schema)
                const transformedValue = {
                    ...value,
                    subjects:
                        value.subjects && value.subjects.length > 0
                            ? value.subjects
                            : undefined,
                };
                const result =
                    school_class_create_input.safeParse(transformedValue);

                // TanStack Form expects undefined on success, or an error object on failure
                if (!result.success) {
                    return result.error.format();
                }
                // Return undefined to indicate validation passed
                return undefined;
            },
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            if (isEditMode && initialData) {
                updateClass({
                    id: initialData.id,
                    name: value.name,
                    level: value.level,
                    school: value.school,
                    students_count: value.students_count,
                    subjects:
                        value.subjects && value.subjects.length > 0
                            ? value.subjects
                            : undefined,
                });
            } else {
                createClass({
                    name: value.name,
                    level: value.level,
                    school: value.school,
                    students_count: value.students_count,
                    subjects:
                        value.subjects && value.subjects.length > 0
                            ? value.subjects
                            : undefined,
                });
            }
        },
    });

    // Reset form when initialData changes (when modal opens with edit data)
    useEffect(() => {
        if (open && initialData) {
            form.setFieldValue("name", initialData.name);
            form.setFieldValue("level", initialData.level);
            form.setFieldValue("school", initialData.school);
            form.setFieldValue("students_count", initialData.students_count);
            form.setFieldValue("subjects", initialData.subjects ?? []);
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
            queryClient.invalidateQueries({ queryKey: ["schoolClasses"] });
            queryClient.invalidateQueries({ queryKey: ["school-classes"] });
            queryClient.invalidateQueries({
                queryKey: orpc.schoolClass.listSchools.queryKey({}),
            });
            queryClient.invalidateQueries({
                queryKey: orpc.schoolClass.listLevels.queryKey({}),
            });
            queryClient.invalidateQueries({
                queryKey: orpc.schoolClass.getWithSubjects.queryKey({
                    input: { id: initialData?.id ?? "" },
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

    const { mutate: createClass } = useMutation({
        mutationFn: async (data: {
            name: string;
            level: string;
            school: string;
            students_count: number;
            subjects?: string[];
        }) => {
            console.log("createClass mutation");

            return await orpc.schoolClass.create.call(data);
        },
        ...getMutationHandlers(
            "Error creating class:",
            "Classe créée avec succès"
        ),
    });

    const { mutate: updateClass } = useMutation({
        mutationFn: async (data: {
            id: string;
            name: string;
            level: string;
            school: string;
            students_count: number;
            subjects?: string[];
        }) => {
            console.log("updateClass mutation");

            return await orpc.schoolClass.patch.call(data);
        },
        ...getMutationHandlers(
            "Error updating class:",
            "Classe modifiée avec succès"
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
                isEditMode ? "Modifier la classe" : "Créer une nouvelle classe"
            }
            children={
                <form
                    id="create-class-form"
                    className="overflow-y-auto"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        {/* Class Name */}
                        <form.Field
                            name="name"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Nom de la classe
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
                                            placeholder="Ex: Terminale S1"
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

                        {/* Level */}
                        <form.Field
                            name="level"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Niveau
                                        </FieldLabel>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(value) =>
                                                field.handleChange(value)
                                            }
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    field.handleBlur();
                                                }
                                            }}
                                        >
                                            <SelectTrigger
                                                id={field.name}
                                                className="w-full"
                                                aria-invalid={isInvalid}
                                            >
                                                <SelectValue placeholder="Sélectionner un niveau" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {defaultClassLevels.map(
                                                    (level) => (
                                                        <SelectItem
                                                            key={level}
                                                            value={level}
                                                        >
                                                            {level}
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

                        {/* School */}
                        <form.Field
                            name="school"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Établissement
                                        </FieldLabel>

                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            list={`${field.name}-list`}
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="Ex: Lycée Jean Moulin"
                                            aria-invalid={isInvalid}
                                        />
                                        {existingSchools.length > 0 && (
                                            <datalist id={`${field.name}-list`}>
                                                {existingSchools.map(
                                                    (school) => (
                                                        <option
                                                            key={school}
                                                            value={school}
                                                        />
                                                    )
                                                )}
                                            </datalist>
                                        )}

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

                        {/* Students Count */}
                        <form.Field
                            name="students_count"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Nombre d'élèves
                                        </FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            min="1"
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
                                                        : parseInt(value, 10)
                                                );
                                            }}
                                            onBlur={field.handleBlur}
                                            placeholder="Ex: 32"
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

                        {/* Subjects Selection */}
                        <form.Field
                            name="subjects"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel>
                                            Matières (optionnel)
                                        </FieldLabel>
                                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                            {availableSubjects.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    Aucune matière disponible.
                                                    Créez d'abord des matières.
                                                </p>
                                            ) : (
                                                availableSubjects.map(
                                                    (subject) => {
                                                        const currentValue =
                                                            field.state.value ??
                                                            [];
                                                        const isChecked =
                                                            currentValue.includes(
                                                                subject.id
                                                            );
                                                        return (
                                                            <label
                                                                key={subject.id}
                                                                className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        isChecked
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) => {
                                                                        if (
                                                                            e
                                                                                .target
                                                                                .checked
                                                                        ) {
                                                                            field.handleChange(
                                                                                [
                                                                                    ...currentValue,
                                                                                    subject.id,
                                                                                ]
                                                                            );
                                                                        } else {
                                                                            field.handleChange(
                                                                                currentValue.filter(
                                                                                    (
                                                                                        id
                                                                                    ) =>
                                                                                        id !==
                                                                                        subject.id
                                                                                )
                                                                            );
                                                                        }
                                                                        field.handleBlur();
                                                                    }}
                                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                />
                                                                <span className="text-sm">
                                                                    {
                                                                        subject.name
                                                                    }
                                                                </span>
                                                            </label>
                                                        );
                                                    }
                                                )
                                            )}
                                        </div>
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
                                            // Avoid unexpected resets of form elements (especially <select> elements)
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
                                        form="create-class-form"
                                        disabled={
                                            !canSubmit || !form.state.isValid
                                        }
                                    >
                                        {isSubmitting
                                            ? isEditMode
                                                ? "Modification..."
                                                : "Création..."
                                            : isEditMode
                                            ? "Modifier la classe"
                                            : "Créer la classe"}
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
