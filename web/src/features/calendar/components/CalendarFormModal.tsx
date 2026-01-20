import * as z from "zod";
import { useForm } from "@tanstack/react-form";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { SelectField, DateField } from "@/components/forms";
import { format, parseISO, setHours, setMinutes, getHours } from "date-fns";
import type { ScheduledCourse } from "../types";
import { FormSheet } from "@/components/ui/form-sheet";
import { SheetClose } from "@/components/ui/sheet";
import { useCourseProgress } from "@/features/courses/api/useCourseProgress";
import { useSubjects } from "@/features/subjects/api/useSubjects";
import { useSchoolClasses } from "@/features/classes/api/useSchoolClasses";
import { useSubjectWithLessons } from "@/features/subjects/api/useSubjects";
import { useLessonProgress } from "@/features/courses/api/useLessonProgress";
import { CpuIcon } from "lucide-react";

const formSchema = z.object({
    course_progress_id: z.string().min(1, "Le cours est requis"),
    lesson_id: z.string().min(1, "La leçon est requise"),
    date: z.string().min(1, "La date est requise"), // yyyy-MM-dd
    slot: z.string().min(1, "Le créneau est requis"), // e.g. "8h-10h"
});

export type CalendarFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: Date;
    initialSlotLabel?: string; // e.g. "8h-9h"
    initialCourse?: ScheduledCourse & {
        lessonProgressId?: string;
        courseProgressId?: string;
        lessonId?: string;
    };
    onSubmit?: (course: ScheduledCourse) => Promise<void> | void;
};

/**
 * Parse slot string (e.g., "8h-10h") to get start hour
 */
function parseSlotToHour(slot: string): number {
    const match = slot.match(/(\d+)h/);
    return match ? parseInt(match[1], 10) : 8;
}

/**
 * Convert date + slot to ISO datetime string
 */
function combineDateAndSlot(dateStr: string, slot: string): string {
    const date = parseISO(dateStr);
    const hour = parseSlotToHour(slot);
    const dateTime = setHours(setMinutes(date, 0), hour);
    return dateTime.toISOString();
}

export function CalendarFormModal({
    open,
    onOpenChange,
    initialDate,
    initialSlotLabel,
    initialCourse,
    onSubmit,
}: CalendarFormModalProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!initialCourse;

    // Fetch data
    const { data: allCourseProgress = [] } = useCourseProgress();
    const { data: allSubjects = [] } = useSubjects();
    const { data: allClasses = [] } = useSchoolClasses();

    console.log("allCourseProgress", allCourseProgress);

    // Get initial lesson progress if editing
    const { data: initialLessonProgress } = useLessonProgress(
        initialCourse?.lessonProgressId
    );

    // Get selected course progress - initialize from initialCourse or initialLessonProgress
    const initialCourseProgressId = useMemo(() => {
        if (initialCourse?.courseProgressId)
            return initialCourse.courseProgressId;
        if (initialLessonProgress?.course_progress_id)
            return initialLessonProgress.course_progress_id;
        return "";
    }, [
        initialCourse?.courseProgressId,
        initialLessonProgress?.course_progress_id,
    ]);

    const [selectedCourseProgressId, setSelectedCourseProgressId] =
        useState<string>(initialCourseProgressId);

    // Update selectedCourseProgressId when initialCourseProgressId changes (e.g., when modal opens with different course)
    useEffect(() => {
        if (
            initialCourseProgressId &&
            initialCourseProgressId !== selectedCourseProgressId
        ) {
            setSelectedCourseProgressId(initialCourseProgressId);
        }
    }, [initialCourseProgressId, selectedCourseProgressId]);

    const selectedCourseProgress = useMemo(() => {
        return allCourseProgress.find(
            (cp) => cp.id === selectedCourseProgressId
        );
    }, [allCourseProgress, selectedCourseProgressId]);

    // Fetch lessons for the selected subject
    const { data: subjectWithLessons } = useSubjectWithLessons(
        selectedCourseProgress?.subject_id || "",
        { enabled: !!selectedCourseProgress?.subject_id }
    );

    console.log("subjectWithLessons", subjectWithLessons);

    // ---------- Mutations ----------
    const { mutate: createLessonProgress } = useMutation({
        mutationFn: (input: {
            lesson_id: string;
            course_progress_id: string;
            status?: string;
            scheduled_date?: string | null;
            comments?: Array<{ title?: string; description: string }>;
        }) => orpc.lessonProgress.create.call({ input } as any),
        onSuccess: () => {
            handleSuccess("Leçon planifiée avec succès");
        },
        onError: (error) => {
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors de la planification de la leçon";
            toast.error(errorMsg);
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    const { mutate: updateLessonProgress } = useMutation({
        mutationFn: (input: {
            id: string;
            status?: string;
            completed_at?: string | null;
            scheduled_date?: string | null;
            comments?: Array<{ title?: string; description: string }>;
        }) => orpc.lessonProgress.patch.call({ input } as any),
        onSuccess: () => {
            handleSuccess("Leçon modifiée avec succès");
        },
        onError: (error) => {
            const errorMsg =
                error instanceof Error
                    ? error.message
                    : "Une erreur est survenue lors de la modification de la leçon";
            toast.error(errorMsg);
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });

    function handleSuccess(message: string) {
        // Invalidate calendar events query
        queryClient.invalidateQueries({
            queryKey: ["calendarEvents"],
        });

        // Invalidate lesson progress queries
        queryClient.invalidateQueries({
            queryKey: ["lessonProgress"],
        });

        queryClient.invalidateQueries({
            queryKey: ["courseProgress"],
        });

        toast.success(message);
        form.reset();
        onOpenChange(false);
    }

    // Get initial date from scheduled_date if editing
    const initialDateStr = useMemo(() => {
        if (initialLessonProgress?.scheduled_date) {
            return format(
                parseISO(initialLessonProgress.scheduled_date),
                "yyyy-MM-dd"
            );
        }
        if (initialCourse?.date) {
            return initialCourse.date;
        }
        if (initialDate) {
            return format(initialDate, "yyyy-MM-dd");
        }
        return "";
    }, [initialLessonProgress, initialCourse, initialDate]);

    // Get initial slot from scheduled_date if editing
    const initialSlotStr = useMemo(() => {
        if (initialLessonProgress?.scheduled_date) {
            const hour = getHours(
                parseISO(initialLessonProgress.scheduled_date)
            );
            const nextHour = hour + 1;
            return `${hour}h-${nextHour}h`;
        }
        if (initialCourse?.slot) {
            return initialCourse.slot;
        }
        if (initialSlotLabel) {
            return initialSlotLabel;
        }
        return "8h-9h";
    }, [initialLessonProgress, initialCourse, initialSlotLabel]);

    // ---------- Form ----------
    const form = useForm({
        defaultValues: {
            course_progress_id: initialCourseProgressId,
            lesson_id:
                initialCourse?.lessonId ||
                initialLessonProgress?.lesson_id ||
                "",
            date: initialDateStr,
            slot: initialSlotStr,
        },
        validators: {
            onSubmit: formSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);

            const scheduledDate = combineDateAndSlot(value.date, value.slot);

            // Call optional onSubmit callback before mutation
            if (onSubmit) {
                const course: ScheduledCourse = {
                    id: initialCourse?.id || "",
                    subject:
                        allSubjects.find(
                            (s) => s.id === selectedCourseProgress?.subject_id
                        )?.name || "",
                    level:
                        allClasses.find(
                            (c) => c.id === selectedCourseProgress?.class_id
                        )?.level || "",
                    color: "blue", // Will be determined by calendar display
                    date: value.date,
                    slot: value.slot,
                };
                await Promise.resolve(onSubmit(course));
            }

            if (isEditMode && initialCourse?.lessonProgressId) {
                // Update existing lesson progress
                updateLessonProgress({
                    id: initialCourse.lessonProgressId,
                    scheduled_date: scheduledDate,
                    status: "scheduled",
                });
            } else {
                // Create new lesson progress
                createLessonProgress({
                    lesson_id: value.lesson_id,
                    course_progress_id: value.course_progress_id,
                    scheduled_date: scheduledDate,
                    status: "scheduled",
                });
            }
        },
    });

    // Update form when course progress changes
    const handleCourseProgressChange = (courseProgressId: string) => {
        setSelectedCourseProgressId(courseProgressId);
        form.setFieldValue("course_progress_id", courseProgressId);
        form.setFieldValue("lesson_id", ""); // Reset lesson selection
    };

    const handleClose = (shouldClose: boolean) => {
        if (shouldClose && !isSubmitting) {
            form.reset();
        }
        onOpenChange(shouldClose);
    };

    // Create display labels for course progress options
    const courseProgressOptions = useMemo(() => {
        const subjectsMap = new Map(allSubjects.map((s) => [s.id, s]));
        const classesMap = new Map(allClasses.map((c) => [c.id, c]));

        console.log("allCourseProgress", allCourseProgress);
        const courseProgressOptions = allCourseProgress
            .map((cp) => {
                const subject = subjectsMap.get(cp.subject_id);
                const schoolClass = classesMap.get(cp.class_id);

                if (!subject || !schoolClass) return null;

                return {
                    id: cp.id,
                    label: `${subject.name} • ${schoolClass.name} (${schoolClass.level})`,
                };
            })
            .filter(
                (opt): opt is { id: string; label: string } => opt !== null
            );
        console.log("courseProgressOptions", courseProgressOptions);
        return courseProgressOptions;
    }, [allCourseProgress, allSubjects, allClasses]);

    // Generate time slot options
    const timeSlotOptions = useMemo(() => {
        return Array.from({ length: 10 }, (_, i) => {
            const hour = 8 + i;
            const nextHour = hour + 1;
            return `${hour}h-${nextHour}h`;
        });
    }, []);

    return (
        <FormSheet
            open={open}
            onOpenChange={handleClose}
            title={isEditMode ? "Modifier une leçon" : "Planifier une leçon"}
            children={
                <form
                    id="add-edit-lesson"
                    className="overflow-y-auto"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        {/* Course Progress Selection */}
                        <form.Field
                            name="course_progress_id"
                            children={(field) => (
                                <SelectField
                                    field={field}
                                    label="Matière et classe"
                                    placeholder="Choisir une matière pour une classe"
                                    options={
                                        courseProgressOptions.map(
                                            (opt) => opt.id
                                        ) as string[]
                                    }
                                    getLabel={(id) => {
                                        const opt = courseProgressOptions.find(
                                            (o) => o.id === id
                                        );
                                        return opt?.label || id;
                                    }}
                                    onValueChange={handleCourseProgressChange}
                                />
                            )}
                        />

                        {/* Lesson Selection */}
                        <form.Field
                            name="lesson_id"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                const lessons =
                                    subjectWithLessons?.lessons || [];

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Leçon
                                        </FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.state.value}
                                            onValueChange={field.handleChange}
                                            disabled={
                                                !selectedCourseProgressId ||
                                                lessons.length === 0
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        !selectedCourseProgressId
                                                            ? "Sélectionnez d'abord un cours"
                                                            : lessons.length ===
                                                              0
                                                            ? "Aucune leçon disponible"
                                                            : "Choisir une leçon"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {lessons.map((lesson) => (
                                                    <SelectItem
                                                        key={lesson.id}
                                                        value={lesson.id}
                                                    >
                                                        {lesson.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError>
                                            {field.state.meta.errors?.map(
                                                (
                                                    error: unknown,
                                                    index: number
                                                ) => (
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

                        {/* Date */}
                        <form.Field
                            name="date"
                            children={(field) => (
                                <DateField field={field} label="Date" />
                            )}
                        />

                        {/* Slot */}
                        <form.Field
                            name="slot"
                            children={(field) => (
                                <SelectField
                                    field={field}
                                    label="Créneau horaire"
                                    placeholder="Choisir un créneau"
                                    options={timeSlotOptions}
                                    getLabel={(slot) => slot}
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
                                        type="button"
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
                                        form="add-edit-lesson"
                                        disabled={
                                            !canSubmit ||
                                            !form.state.isValid ||
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting
                                            ? isEditMode
                                                ? "Modification..."
                                                : "Planification..."
                                            : isEditMode
                                            ? "Modifier"
                                            : "Planifier"}
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
