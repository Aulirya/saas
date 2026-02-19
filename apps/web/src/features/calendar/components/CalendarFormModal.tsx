import * as z from "zod";
import { useForm } from "@tanstack/react-form";
import { useState, useMemo, useEffect } from "react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { SelectField, DateField } from "@/components/forms";
import {
  format,
  parseISO,
  setHours,
  setMinutes,
  getHours,
  getDay,
} from "date-fns";
import type { ScheduledCourse } from "../types";
import { FormSheet } from "@/components/ui/form-sheet";
import { SheetClose } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCheckScheduleConflicts,
  useCourseProgress,
  useGenerateLessonProgressSchedule,
  useUpdateCourseProgressSchedule,
} from "@/features/courses/api/useCourseProgress";
import { useLessonProgress } from "@/features/courses/api/useLessonProgress";
import { useSubjects } from "@/features/subjects/api/useSubjects";
import { useSchoolClasses } from "@/features/classes/api/useSchoolClasses";
import type { RecurringScheduleSlot } from "shared";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  course_progress_id: z.string().min(1, "Le cours est requis"),
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

function parseSlotToRange(slot: string): {
  startHour: number;
  endHour: number;
} {
  const match = slot.match(/(\d+)h\s*-\s*(\d+)h/);
  if (match) {
    return {
      startHour: parseInt(match[1], 10),
      endHour: parseInt(match[2], 10),
    };
  }
  const startHour = parseSlotToHour(slot);
  return { startHour, endHour: startHour + 1 };
}

function normalizeSlotLabel(slotLabel: string) {
  if (!slotLabel.includes("-")) {
    const startHour = parseSlotToHour(slotLabel);
    return `${startHour}h-${startHour + 1}h`;
  }
  return slotLabel;
}

function buildRecurringSlot(
  dateStr: string,
  slot: string,
): RecurringScheduleSlot {
  const { startHour, endHour } = parseSlotToRange(slot);
  const date = parseISO(dateStr);
  const startDateTime = setHours(setMinutes(date, 0), startHour);
  const dayOfWeek = getDay(date);

  return {
    day_of_week: dayOfWeek === 0 ? 7 : dayOfWeek,
    start_hour: startHour,
    end_hour: endHour,
    start_date: startDateTime.toISOString(),
  };
}

function upsertRecurringSlot(
  existingSlots: RecurringScheduleSlot[],
  newSlot: RecurringScheduleSlot,
): { nextSlots: RecurringScheduleSlot[]; changed: boolean } {
  const existingIndex = existingSlots.findIndex(
    (slot) =>
      slot.day_of_week === newSlot.day_of_week &&
      slot.start_hour === newSlot.start_hour &&
      slot.end_hour === newSlot.end_hour,
  );

  if (existingIndex === -1) {
    return { nextSlots: [...existingSlots, newSlot], changed: true };
  }

  const existingSlot = existingSlots[existingIndex];
  if (existingSlot.start_date === newSlot.start_date) {
    return { nextSlots: existingSlots, changed: false };
  }

  return {
    nextSlots: existingSlots.map((slot, index) =>
      index === existingIndex
        ? { ...slot, start_date: newSlot.start_date }
        : slot,
    ),
    changed: true,
  };
}

export function CalendarFormModal({
  open,
  onOpenChange,
  initialDate,
  initialSlotLabel,
  initialCourse,
  onSubmit: _onSubmit,
}: CalendarFormModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialCourse;
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    course_progress_id: string;
    date: string;
    slot: string;
  } | null>(null);

  // Fetch data
  const { data: allCourseProgress = [] } = useCourseProgress();
  const { data: allSubjects = [] } = useSubjects();
  const { data: allClasses = [] } = useSchoolClasses();

  // Get initial lesson progress if editing
  const { data: initialLessonProgress } = useLessonProgress(
    initialCourse?.lessonProgressId,
  );

  // Get selected course progress - initialize from initialCourse or initialLessonProgress
  const initialCourseProgressId = useMemo(() => {
    if (initialCourse?.courseProgressId) return initialCourse.courseProgressId;
    if (initialLessonProgress?.course_progress_id)
      return initialLessonProgress.course_progress_id;
    return "";
  }, [
    initialCourse?.courseProgressId,
    initialLessonProgress?.course_progress_id,
  ]);

  const [selectedCourseProgressId, setSelectedCourseProgressId] =
    useState<string>(initialCourseProgressId);

  const { mutateAsync: updateCourseProgressSchedule } =
    useUpdateCourseProgressSchedule(selectedCourseProgressId);
  const { mutateAsync: generateLessonProgressSchedule } =
    useGenerateLessonProgressSchedule();

  // Update selectedCourseProgressId when initialCourseProgressId changes (e.g., when modal opens with different course)
  useEffect(() => {
    if (
      initialCourseProgressId &&
      initialCourseProgressId !== selectedCourseProgressId
    ) {
      setSelectedCourseProgressId(initialCourseProgressId);
    }
  }, [initialCourseProgressId, selectedCourseProgressId]);

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
        "yyyy-MM-dd",
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
      const hour = getHours(parseISO(initialLessonProgress.scheduled_date));
      const nextHour = hour + 1;
      return `${hour}h-${nextHour}h`;
    }
    if (initialCourse?.startDateTime && initialCourse?.endDateTime) {
      const startHour = getHours(parseISO(initialCourse.startDateTime));
      let endHour = getHours(parseISO(initialCourse.endDateTime));
      if (endHour <= startHour) {
        endHour = startHour + 1;
      }
      return `${startHour}h-${endHour}h`;
    }
    if (initialSlotLabel) {
      return normalizeSlotLabel(initialSlotLabel);
    }
    return "8h-9h";
  }, [initialLessonProgress, initialCourse, initialSlotLabel]);

  // ---------- Form ----------
  const form = useForm({
    defaultValues: {
      course_progress_id: initialCourseProgressId,
      date: initialDateStr,
      slot: initialSlotStr,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const candidate =
        buildSubmissionCandidate(
          value.course_progress_id,
          value.date,
          value.slot,
        ) ?? null;
      if (!candidate) {
        toast.error("Le cours sélectionné est introuvable.");
        return;
      }

      if (conflictsCount > 0) {
        setPendingSubmission({
          course_progress_id: value.course_progress_id,
          date: value.date,
          slot: value.slot,
        });
        setShowConflictModal(true);
        return;
      }

      await performSave(candidate);
    },
  });

  function buildSubmissionCandidate(
    courseProgressId: string,
    date: string,
    slot: string,
  ): {
    courseProgressId: string;
    nextSlots: RecurringScheduleSlot[];
    changed: boolean;
  } | null {
    const courseProgressForSchedule = allCourseProgress.find(
      (cp) => cp.id === courseProgressId,
    );
    if (!courseProgressForSchedule || !date || !slot) {
      return null;
    }

    const newSlot = buildRecurringSlot(date, slot);
    const { nextSlots, changed } = upsertRecurringSlot(
      courseProgressForSchedule.recurring_schedule || [],
      newSlot,
    );

    return {
      courseProgressId: courseProgressForSchedule.id,
      nextSlots,
      changed,
    };
  }

  const candidateSlots = useMemo(() => {
    const values = form.state.values;
    const candidate = buildSubmissionCandidate(
      values.course_progress_id,
      values.date,
      values.slot,
    );
    return candidate?.nextSlots ?? [];
  }, [allCourseProgress, form.state.values]);

  const [debouncedSlots] = useDebouncedValue(candidateSlots, { wait: 400 });
  const { data: conflictsData } = useCheckScheduleConflicts(
    selectedCourseProgressId,
    debouncedSlots,
    debouncedSlots.length > 0 && !!selectedCourseProgressId,
  );
  const conflictsCount = conflictsData?.conflicts?.length ?? 0;

  async function performSave(candidate: {
    courseProgressId: string;
    nextSlots: RecurringScheduleSlot[];
    changed: boolean;
  }) {
    setIsSubmitting(true);
    try {
      if (candidate.changed) {
        await updateCourseProgressSchedule({
          id: candidate.courseProgressId,
          recurring_schedule: candidate.nextSlots,
        });
      }

      await generateLessonProgressSchedule({
        course_progress_id: candidate.courseProgressId,
        options: {
          regenerate_existing: true,
        },
      });

      handleSuccess(
        isEditMode
          ? "Créneau récurrent modifié avec succès"
          : "Créneau récurrent ajouté avec succès",
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la planification des leçons";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Update form when course progress changes
  const handleCourseProgressChange = (courseProgressId: string) => {
    setSelectedCourseProgressId(courseProgressId);
    form.setFieldValue("course_progress_id", courseProgressId);
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
      .filter((opt): opt is { id: string; label: string } => opt !== null);
    // console.log("courseProgressOptions", courseProgressOptions);
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
    <>
      <FormSheet
        open={open}
        onOpenChange={handleClose}
        title={isEditMode ? "Modifier un créneau" : "Ajouter un créneau"}
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
                      courseProgressOptions.map((opt) => opt.id) as string[]
                    }
                    getLabel={(id) => {
                      const opt = courseProgressOptions.find(
                        (o) => o.id === id,
                      );
                      return opt?.label || id;
                    }}
                    onValueChange={handleCourseProgressChange}
                  />
                )}
              />

              {/* Date */}
              <form.Field
                name="date"
                children={(field) => <DateField field={field} label="Date" />}
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
                selector={(state) => [state.canSubmit, state.isSubmitting]}
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
                        !canSubmit || !form.state.isValid || isSubmitting
                      }
                    >
                      {isSubmitting
                        ? isEditMode
                          ? "Modification..."
                          : "Ajout..."
                        : isEditMode
                          ? "Modifier"
                          : "Ajouter"}
                    </Button>
                  </>
                )}
              />
            </SheetClose>
          </div>
        }
      />
      <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
              Conflit de créneaux
            </DialogTitle>
            <DialogDescription>
              Il y a {conflictsCount} conflit
              {conflictsCount > 1 ? "s" : ""} avec d'autres cours. Enregistrer
              ce créneau peut créer des chevauchements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConflictModal(false);
                setPendingSubmission(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!pendingSubmission) {
                  setShowConflictModal(false);
                  return;
                }
                setShowConflictModal(false);
                const candidate = buildSubmissionCandidate(
                  pendingSubmission.course_progress_id,
                  pendingSubmission.date,
                  pendingSubmission.slot,
                );
                setPendingSubmission(null);
                if (candidate) {
                  await performSave(candidate);
                }
              }}
              disabled={isSubmitting}
            >
              Enregistrer quand même
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
