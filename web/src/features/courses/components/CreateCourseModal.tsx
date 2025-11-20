import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

import { FormSheet } from "@/components/ui/form-sheet";
import { Button } from "@/components/ui/button";
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
import { SheetClose } from "@/components/ui/sheet";
import { z } from "zod";

const formSchema = z.object({
    class_id: z.string().min(1, "La classe est requise"),
    subject_id: z.string().min(1, "La matière est requise"),
});

interface CreateCourseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateCourseModal({
    open,
    onOpenChange,
}: CreateCourseModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch classes and subjects for dropdowns
    const { data: classes = [] } = useQuery(
        orpc.schoolClass.list.queryOptions({})
    );
    const { data: subjects = [] } = useQuery(
        orpc.subject.list.queryOptions({})
    );

    const form = useForm({
        defaultValues: {
            class_id: "",
            subject_id: "",
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            // createCourse({
            //     input: {
            //         class_id: value.class_id,
            //         subject_id: value.subject_id,
            //     },
            // });
        },
    });

    const { mutate: createCourse } = useMutation({
        mutationFn: orpc.course.create.call,
        onSuccess: () => {
            // Invalidate queries so lists will refetch and show fresh data
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            // Reset form UI state
            form.reset();
            // Close modal upon success
            onOpenChange(false);
        },
        onError: (error) => {
            // Log error for devs
            console.error("Error creating course:", error);
            // Allow resubmission in UI
            setIsSubmitting(false);
            // (UI feedback e.g. toast could go here)
        },
        onSettled: () => {
            // Always re-enable submission button at the end
            setIsSubmitting(false);
        },
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
            onOpenChange={handleClose}
            title="Créer un nouveau cours"
            children={
                <form
                    id="create-course-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        {/* Class Selection */}
                        <form.Field
                            name="class_id"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Classe
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
                                                <SelectValue placeholder="Sélectionner une classe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((classItem) => (
                                                    <SelectItem
                                                        key={classItem.id}
                                                        value={classItem.id}
                                                    >
                                                        {classItem.name} -{" "}
                                                        {classItem.level}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError>
                                            {field.state.meta.errors}
                                        </FieldError>
                                    </Field>
                                );
                            }}
                        />

                        {/* Subject Selection */}
                        <form.Field
                            name="subject_id"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Matière
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
                                                <SelectValue placeholder="Sélectionner une matière" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map((subject) => (
                                                    <SelectItem
                                                        key={subject.id}
                                                        value={subject.id}
                                                    >
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError>
                                            {field.state.meta.errors}
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
                                        form="create-course-form"
                                        disabled={
                                            !canSubmit || !form.state.isValid
                                        }
                                    >
                                        {isSubmitting
                                            ? "Création..."
                                            : "Créer le cours"}
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
