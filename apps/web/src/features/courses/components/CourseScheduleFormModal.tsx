// React

import { useMemo } from "react";
import { useDebouncedValue } from "@tanstack/react-pacer";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/ui/empty-state-card";

// Icons
import { Save, CheckCircle2, AlertCircle, Clock, Plus } from "lucide-react";

// Components
import { ScheduleSlotCard } from "./ScheduleSlotCard";

// Utils & Types
import { cn } from "@/lib/utils";
import { RecurringScheduleSlot } from "shared";
import { useCheckScheduleConflicts } from "../api/useCourseProgress";

export type ScheduleSlot = {
  day_of_week: number;
  start_hour: number;
  end_hour: number;
};

export type CourseScheduleFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  slots: RecurringScheduleSlot[];
  onRemoveSlot?: (index: number) => void;
  onAddSlot?: () => void;
  onUpdateSlot?: (
    index: number,
    updates: Partial<RecurringScheduleSlot>,
  ) => void;
  onSave?: () => void;
  onCancel?: () => void;
  courseId: string;
};

const isSlotValid = (slot: RecurringScheduleSlot) =>
  slot.end_hour > slot.start_hour;

const slotKey = (slot: RecurringScheduleSlot) =>
  `${slot.day_of_week}-${slot.start_hour}-${slot.end_hour}`;

export function CourseScheduleFormModal({
  open,
  onOpenChange,
  title = "Planifier un cours",
  slots,
  courseId,
  onRemoveSlot = () => {},
  onAddSlot = () => {},
  onUpdateSlot = () => {},
  onSave,
  onCancel,
}: CourseScheduleFormModalProps) {
  // Helper functions
  const pluralize = (count: number, singular: string, plural: string) =>
    count > 1 ? plural : singular;

  // Conflict Detection (Conflicts API)
  const [debouncedSlots] = useDebouncedValue(slots, { wait: 500 });
  const { data: conflictsData } = useCheckScheduleConflicts(
    courseId,
    debouncedSlots,
    true,
  );

  // compare existing slots with debounced slots and create a map of conflicts
  const conflictMap = useMemo(() => {
    const map = new Map<
      number,
      { message: string; conflictingCourseId?: string }
    >();

    if (!conflictsData?.conflicts || debouncedSlots.length === 0) {
      return map;
    }

    // Build a map of slotKey -> latest index (most recent)
    const latestIndexByKey = new Map<string, number>();
    debouncedSlots.forEach((slot, index) => {
      latestIndexByKey.set(slotKey(slot), index);
    });

    conflictsData.conflicts.forEach((conflict) => {
      const index = latestIndexByKey.get(slotKey(conflict.slot));
      if (index !== undefined) {
        map.set(index, {
          message: conflict.message,
          conflictingCourseId: conflict.conflicting_course_progress_id,
        });
      }
    });

    return map;
  }, [conflictsData?.conflicts, debouncedSlots]);

  // Use debounced slots for status to keep UI consistent with conflict results
  const validSlotsCount = debouncedSlots.filter(isSlotValid).length;
  const conflictsCount = conflictMap.size;

  const allSlotsValid =
    slots.length > 0 &&
    validSlotsCount === slots.length &&
    conflictsCount === 0;

  const hasErrors = slots.some((s) => !isSlotValid(s)) || conflictsCount > 0;

  const validSlotsWithoutConflicts = Math.max(
    0,
    validSlotsCount - conflictsCount,
  );

  // Generate status message
  const getStatusMessage = () => {
    if (allSlotsValid) {
      return "Tous les créneaux sont valides";
    }
    if (hasErrors) {
      const validText = `${validSlotsWithoutConflicts} ${pluralize(
        validSlotsWithoutConflicts,
        "valide",
        "valides",
      )}`;
      const conflictText = `${conflictsCount} ${pluralize(
        conflictsCount,
        "conflit",
        "conflits",
      )}`;
      return `${validText} • ${conflictText}`;
    }
    const slotText = `${validSlotsCount} ${pluralize(
      validSlotsCount,
      "créneau valide",
      "créneaux valides",
    )}`;
    return `En cours de configuration • ${slotText}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configurez les créneaux récurrents pour la planification automatique
            des cours.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 flex flex-col gap-4">
          {/* Status Summary Banner */}
          {slots.length > 0 && (
            <div
              className={cn(
                "rounded-lg border p-4 transition-colors",
                allSlotsValid
                  ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                  : hasErrors
                    ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                    : "bg-muted/50 border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {allSlotsValid ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  ) : hasErrors ? (
                    <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Clock className="size-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {slots.length}{" "}
                      {pluralize(
                        slots.length,
                        "créneau configuré",
                        "créneaux configurés",
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getStatusMessage()}
                    </p>
                  </div>
                </div>
                {allSlotsValid && (
                  <Badge variant="success" className="text-xs">
                    Prêt
                  </Badge>
                )}
              </div>
            </div>
          )}

          {slots.length === 0 ? (
            <EmptyStateCard
              title="Aucun créneau configuré"
              description="Ajoutez au moins un créneau pour activer la planification automatique."
              buttonText="Ajouter un créneau"
              onButtonClick={onAddSlot}
            />
          ) : (
            <>
              <div className="space-y-4">
                {slots.map((slot, index) => {
                  return (
                    <ScheduleSlotCard
                      key={index}
                      slot={slot}
                      index={index}
                      conflictData={conflictMap.get(index)}
                      onOpenConflictCourse={() => onOpenChange(false)}
                      onRemove={onRemoveSlot}
                      onUpdate={onUpdateSlot}
                    />
                  );
                })}
              </div>

              {/* Add slot button */}
              <Button
                onClick={onAddSlot}
                variant="outline"
                className="w-full border-dashed"
                size="lg"
              >
                <Plus className="size-4 mr-2" />
                Ajouter un créneau
              </Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button variant="default" onClick={onSave}>
            <Save className="size-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
