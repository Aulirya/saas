import * as z from "zod";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import { format } from "date-fns";
import type { ScheduledCourse, CourseColor } from "../types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";

// Predefined options (placeholder until wired to real data)
const SUBJECT_OPTIONS = ["Math", "Physique", "Chimie"] as const;
const LEVEL_OPTIONS = ["2nde", "1ère S", "Terminale S"] as const;

// Subject -> Color mapping
const SUBJECT_TO_COLOR: Record<string, CourseColor> = {
    Math: "blue",
    Physique: "green",
    Chimie: "purple",
};

// remove color from schema; it is derived from subject
const formSchema = z.object({
    subject: z.string().min(1, "La matière est requise"),
    level: z.string().min(1, "Le niveau est requis"),
    date: z.string().min(1, "La date est requise"), // yyyy-MM-dd
    slot: z.string().min(1, "Le créneau est requis"), // e.g. "8h-10h"
});

export type LessonModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: Date;
    initialSlotLabel?: string; // e.g. "8h-9h"
    initialCourse?: ScheduledCourse; // when editing an existing course
    onSubmit: (course: ScheduledCourse) => Promise<void> | void;
};

export function LessonModal({
    open,
    onOpenChange,
    initialDate,
    initialSlotLabel,
    initialCourse,
    onSubmit,
}: LessonModalProps) {
    const form = useForm({
        defaultValues: {
            subject: initialCourse?.subject ?? "",
            level: initialCourse?.level ?? "",
            date:
                initialCourse?.date ??
                (initialDate ? format(initialDate, "yyyy-MM-dd") : ""),
            slot: initialCourse?.slot ?? initialSlotLabel ?? "",
        },
        validators: {
            onSubmit: formSchema,
        },

        onSubmit: async ({ value }) => {
            const derivedColor: CourseColor =
                SUBJECT_TO_COLOR[value.subject] ?? "blue";
            const course: ScheduledCourse = {
                id:
                    typeof crypto !== "undefined" && "randomUUID" in crypto
                        ? crypto.randomUUID()
                        : String(Date.now()),
                subject: value.subject,
                level: value.level,
                color: derivedColor,
                date: value.date,
                slot: value.slot,
            };
            await Promise.resolve(onSubmit(course));
            onOpenChange(false);
            form.reset();
        },
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>
                        {initialCourse
                            ? "Modifier une leçon"
                            : "Ajouter une leçon"}
                    </SheetTitle>
                </SheetHeader>

                <form
                    id="add-edit-lesson"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        {/* Subject */}
                        <form.Field
                            name="subject"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <>
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>
                                                Matière
                                            </FieldLabel>
                                            <Select
                                                name={field.name}
                                                value={field.state.value}
                                                onValueChange={
                                                    field.handleChange
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir une matière" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SUBJECT_OPTIONS.map(
                                                        (s) => (
                                                            <SelectItem
                                                                key={s}
                                                                value={s}
                                                            >
                                                                {s}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {isInvalid && (
                                                <FieldError
                                                    errors={
                                                        field.state.meta.errors
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </>
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
                                    <>
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>
                                                Niveau
                                            </FieldLabel>
                                            <Select
                                                name={field.name}
                                                value={field.state.value}
                                                onValueChange={
                                                    field.handleChange
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir un niveau" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LEVEL_OPTIONS.map(
                                                        (lvl) => (
                                                            <SelectItem
                                                                key={lvl}
                                                                value={lvl}
                                                            >
                                                                {lvl}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {isInvalid && (
                                                <FieldError
                                                    errors={
                                                        field.state.meta.errors
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </>
                                );
                            }}
                        />

                        <form.Field
                            name="date"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <>
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>
                                                Date
                                            </FieldLabel>
                                            <Input
                                                id="date"
                                                type="date"
                                                name={field.name}
                                                value={field.state.value}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            {isInvalid && (
                                                <FieldError
                                                    errors={
                                                        field.state.meta.errors
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </>
                                );
                            }}
                        />

                        {/* Slot */}
                        {initialSlotLabel}

                        <form.Field
                            name="slot"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <>
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>
                                                Créneau
                                            </FieldLabel>
                                            <Select
                                                name={field.name}
                                                value={field.state.value}
                                                onValueChange={
                                                    field.handleChange
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir un créneau" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from(
                                                        { length: 10 },
                                                        (_, i) => {
                                                            const hour = 8 + i;
                                                            const nextHour =
                                                                hour + 1;
                                                            const label = `${hour}h-${nextHour}h`;
                                                            return (
                                                                <SelectItem
                                                                    value={
                                                                        label
                                                                    }
                                                                    key={label}
                                                                >
                                                                    {label}
                                                                </SelectItem>
                                                            );
                                                        }
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {isInvalid && (
                                                <FieldError
                                                    errors={
                                                        field.state.meta.errors
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </>
                                );
                            }}
                        />
                    </FieldGroup>
                    <SheetFooter>
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
                                                type="submit"
                                                disabled={!canSubmit}
                                            >
                                                {isSubmitting
                                                    ? "..."
                                                    : initialCourse
                                                    ? "Modifier"
                                                    : "Ajouter"}
                                            </Button>
                                            <Button
                                                type="reset"
                                                variant="outline"
                                                onClick={(e) => {
                                                    // Avoid unexpected resets of form elements (especially <select> elements)
                                                    e.preventDefault();
                                                    form.reset();
                                                }}
                                            >
                                                Effacer
                                            </Button>
                                        </>
                                    )}
                                />
                            </SheetClose>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
