import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const classLevels = [
    "6ème",
    "5ème",
    "4ème",
    "3ème",
    "Seconde",
    "Première",
    "Terminale",
] as const;

// Use the shared schema directly - validation is already defined there
const formSchema = school_class_create_input;

interface CreateClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateClassModal({
    open,
    onOpenChange,
}: CreateClassModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            name: "",
            level: "",
            school: "",
            students_count: 0,
        },
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            createClass({
                name: value.name,
                level: value.level,
                school: value.school,
                students_count: value.students_count,
            });
        },
    });

    const { mutate: createClass } = useMutation({
        mutationFn: orpc.schoolClass.create.call,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["school-classes"] });
            form.reset();
            onOpenChange(false);
        },
        onError: (error) => {
            console.error("Error creating class:", error);
            setIsSubmitting(false);
            // You could add a toast notification here
        },
        onSettled: () => {
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
            onOpenChange={onOpenChange}
            title="Créer  une nouvelle classe"
            children={
                <form
                    id="create-class-form"
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
                                            {field.state.meta.errors}
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
                                                {classLevels.map((level) => (
                                                    <SelectItem
                                                        key={level}
                                                        value={level}
                                                    >
                                                        {level}
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
                                        <FieldError>
                                            {field.state.meta.errors}
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
                                        form="create-class-form"
                                        disabled={
                                            !canSubmit || !form.state.isValid
                                        }
                                    >
                                        {isSubmitting
                                            ? "Création..."
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
