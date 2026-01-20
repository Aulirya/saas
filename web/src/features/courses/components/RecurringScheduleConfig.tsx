import { useEffect, useState } from "react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Clock,
    Calendar as CalendarIcon,
    AlertCircle,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DAYS_OF_WEEK,
    formatTimeRange,
    getSlotDuration,
} from "@/lib/schedule-constants";
import { CourseScheduleFormModal } from "./CourseScheduleFormModal";
import { RecurringScheduleSlot } from "@saas/shared";
import {
    useCheckScheduleConflicts,
    useGenerateLessonProgressSchedule,
    useUpdateCourseProgressSchedule,
} from "../api/useCourseProgress";

export function RecurringScheduleConfig({
    courseId,
    initialSlots = [],
}: {
    courseId: string;
    initialSlots?: RecurringScheduleSlot[];
}) {
    const [savedSlots, setSavedSlots] =
        useState<RecurringScheduleSlot[]>(initialSlots);
    const [draftSlots, setDraftSlots] =
        useState<RecurringScheduleSlot[]>(initialSlots);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);

    // Slot validation (end should be after start)
    const isSlotValid = (slot: RecurringScheduleSlot) =>
        slot.end_hour > slot.start_hour;

    // Throttle conflict checking for confirm-on-save
    const [debouncedDraftSlots] = useDebouncedValue(draftSlots, { wait: 500 });
    const { data: conflictsData } = useCheckScheduleConflicts(
        courseId,
        debouncedDraftSlots,
        true
    );
    const conflictsCount = conflictsData?.conflicts?.length ?? 0;

    const { mutate: mutateSchedule, isPending: isSaving } =
        useUpdateCourseProgressSchedule(courseId);
    const { mutate: generateSchedule, isPending: isGenerating } =
        useGenerateLessonProgressSchedule();
    const isBusy = isSaving || isGenerating;

    // ---------------------
    // Schedule Summary Card UI
    // ---------------------
    const ScheduleSummary = () => {
        if (savedSlots.length === 0) {
            // Show empty state
            return (
                <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                        Aucun créneau configuré
                    </p>
                    <Button
                        onClick={() => handleOpenChange(true)}
                        variant="outline"
                        size="sm"
                    >
                        <Plus className="size-4 mr-2" />
                        Configurer les créneaux
                    </Button>
                </div>
            );
        }

        // List configured slots, with warnings if invalid
        return (
            <div className="space-y-3">
                <div className="space-y-2">
                    {savedSlots.map((slot, index) => {
                        const dayLabel =
                            DAYS_OF_WEEK.find(
                                (d) => d.value === slot.day_of_week
                            )?.label || "";
                        const duration = getSlotDuration(
                            slot.start_hour,
                            slot.end_hour
                        );
                        const isValid = isSlotValid(slot);

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border text-sm",
                                    isValid
                                        ? "bg-muted/30 border-border"
                                        : "bg-destructive/5 border-destructive/30"
                                )}
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="flex items-center gap-2 grow">
                                        <CalendarIcon className="size-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {dayLabel}
                                        </span>
                                        <span className="">
                                            {formatTimeRange(
                                                slot.start_hour,
                                                slot.end_hour
                                            )}
                                        </span>
                                    </div>
                                    {duration > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {duration}h
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {!isValid && (
                                    <AlertCircle className="size-4 text-destructive" />
                                )}
                            </div>
                        );
                    })}
                </div>
                <Button
                    onClick={() => setShowConfigModal(true)}
                    variant="default-outline"
                    className="w-full"
                    size="sm"
                >
                    <Settings className="size-4 mr-2" />
                    {savedSlots.length > 0 ? "Modifier" : "Configurer"} les
                    créneaux
                </Button>
            </div>
        );
    };

    // ---------------------
    // Slot Management Handlers
    // ---------------------
    const handleAddSlot = () => {
        setDraftSlots([
            ...draftSlots,
            {
                day_of_week: 1,
                start_hour: 8,
                end_hour: 9,
                start_date: new Date().toISOString(),
            },
        ]);
    };

    const handleUpdateSlot = (
        index: number,
        updates: Partial<RecurringScheduleSlot>
    ) => {
        setDraftSlots(
            draftSlots.map((slot, i) =>
                i === index ? { ...slot, ...updates } : slot
            )
        );
    };

    const handleRemoveSlot = (index: number) => {
        setDraftSlots(draftSlots.filter((_, i) => i !== index));
    };

    const handleOpenChange = (open: boolean) => {
        setDraftSlots(savedSlots);
        if (!open) {
            setShowConflictModal(false);
        }
        setShowConfigModal(open);
    };

    const handleCancel = () => {
        setDraftSlots(savedSlots);
    };

    const performSave = () => {
        if (isBusy) {
            return;
        }
        if (showConflictModal === true) {
            setShowConflictModal(false);
        }
        mutateSchedule(
            {
                id: courseId,
                recurring_schedule: draftSlots,
            },
            {
                onSuccess: () => {
                    setSavedSlots(draftSlots);
                    setDraftSlots(draftSlots);
                    setShowConfigModal(false);
                    generateSchedule({
                        course_progress_id: courseId,
                        options: {
                            regenerate_existing: true,
                        },
                    });
                },
            }
        );
    };

    const handleSave = () => {
        if (isBusy) {
            return;
        }
        if (conflictsCount > 0) {
            setShowConflictModal(true);
            return;
        }
        performSave();
    };

    useEffect(() => {
        setSavedSlots(initialSlots);
        if (!showConfigModal) {
            setDraftSlots(initialSlots);
        }
    }, [initialSlots, showConfigModal]);

    return (
        <div>
            <ScheduleSummary />
            <CourseScheduleFormModal
                courseId={courseId}
                open={showConfigModal}
                onOpenChange={handleOpenChange}
                title="Configurer les créneaux récurrents"
                slots={draftSlots}
                onAddSlot={handleAddSlot}
                onUpdateSlot={handleUpdateSlot}
                onRemoveSlot={handleRemoveSlot}
                onCancel={handleCancel}
                onSave={handleSave}
            />
            <Dialog
                open={showConflictModal}
                onOpenChange={setShowConflictModal}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
                            Conflit de créneaux
                        </DialogTitle>
                        <DialogDescription>
                            Il y a {conflictsCount} conflit
                            {conflictsCount > 1 ? "s" : ""} avec d'autres cours.
                            Enregistrer ces créneaux peut créer des
                            chevauchements.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowConflictModal(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setShowConflictModal(false);
                                performSave();
                            }}
                            disabled={isBusy}
                        >
                            Enregistrer quand même
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default RecurringScheduleConfig;
