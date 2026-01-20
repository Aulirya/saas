import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/orpc/client";

import { FormSheet } from "@/components/ui/form-sheet";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { SelectField } from "@/components/forms";

import { SheetClose } from "@/components/ui/sheet";
import { z } from "zod";
import { CourseProgressCreateInput } from "@saas/shared";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const formSchema = z.object({
    class_id: z.string().min(1, "La classe est requise"),
    subject_id: z.string().min(1, "La matière est requise"),
});

interface CourseFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CourseFormModal({ open, onOpenChange }: CourseFormModalProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch classes and subjects for dropdowns
    const { data: classes = [] } = useQuery(
        orpc.schoolClass.list.queryOptions({})
    );
    const { data: subjects = [] } = useQuery(
        orpc.subject.list.queryOptions({})
    );

    // ---------- Mutation ----------
    const { mutate: createCourseProgress } = useMutation({
        mutationFn: async (data: CourseProgressCreateInput) => {
            return await orpc.courseProgress.create.call({
                class_id: data.class_id,
                subject_id: data.subject_id,
            });
        },

        onSuccess: (createdCourseProgress) => {
            handleSuccess("Cours créé avec succès", createdCourseProgress.id);
        },
        onError: (error) => {
            console.error("Error creating course:", error);
            handleError(error, "Error creating course:", error.message);
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    // ---------- Form ----------
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
            createCourseProgress({
                class_id: value.class_id,
                subject_id: value.subject_id,
                status: "not_started",
            });
        },
    });

    // ---------- Handlers ----------
    const handleClose = (shouldClose: boolean) => {
        if (shouldClose && !isSubmitting) {
            form.reset();
        }
        onOpenChange(shouldClose);
    };

    function handleSuccess(message: string, courseProgressId: string) {
        // Invalidate queries
        queryClient.invalidateQueries({
            queryKey: orpc.courseProgress.list.queryKey({
                input: {},
            }),
        });

        toast.success(message);
        form.reset();
        onOpenChange(false);
        // Redirect to the detail page
        navigate({
            to: "/courses/$courseId",
            params: { courseId: courseProgressId },
        });
    }

    function handleError(error: any, contextMsg: string, toastMsg: string) {
        console.error(contextMsg, error);
        toast.error(toastMsg);
    }

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
                            children={(field) => (
                                <SelectField
                                    field={field}
                                    label="Classe"
                                    placeholder="Sélectionner une classe"
                                    required
                                    options={classes.map((c) => c.id)}
                                    getLabel={(id) => {
                                        const classItem = classes.find(
                                            (c) => c.id === id
                                        );
                                        return classItem
                                            ? `${classItem.name} - ${classItem.level}`
                                            : "";
                                    }}
                                />
                            )}
                        />

                        {/* Subject Selection */}
                        <form.Field
                            name="subject_id"
                            children={(field) => (
                                <SelectField
                                    field={field}
                                    label="Matière"
                                    placeholder="Sélectionner une matière"
                                    required
                                    options={subjects.map((s) => s.id)}
                                    getLabel={(id) => {
                                        const subject = subjects.find(
                                            (s) => s.id === id
                                        );
                                        return subject?.name || "";
                                    }}
                                />
                            )}
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
