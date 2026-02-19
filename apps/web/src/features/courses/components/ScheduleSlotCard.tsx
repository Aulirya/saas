// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
// Icons
import {
  CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  ExternalLink,
} from "lucide-react";

// Utils & Types
import { cn } from "@/lib/utils";
import { RecurringScheduleSlot } from "shared";
import { DAYS_OF_WEEK, getSlotDuration, HOURS } from "@/lib/schedule-constants";
import { format, parseISO, isValid as isValidDate } from "date-fns";

export type ScheduleSlotCardProps = {
  slot: RecurringScheduleSlot;
  index: number;
  conflictData?: { message: string; conflictingCourseId?: string };
  onOpenConflictCourse?: () => void;
  onRemove?: (index: number) => void;
  onUpdate?: (index: number, updates: Partial<RecurringScheduleSlot>) => void;
};

const isSlotValid = (slot: RecurringScheduleSlot) =>
  slot.end_hour > slot.start_hour;

type SlotStatus = "error" | "warning" | "success";

const getSlotStatus = (
  slot: RecurringScheduleSlot,
  hasConflict: boolean,
): SlotStatus =>
  !isSlotValid(slot) ? "error" : hasConflict ? "warning" : "success";

const STATUS_CONFIG = {
  error: {
    card: "border-destructive/50 bg-destructive/5",
    iconWrap: "bg-destructive/10",
    icon: "text-destructive",
    badgeVariant: "outline",
    badgeClass:
      "text-xs border-destructive/50 text-destructive bg-destructive/10",
    badgeIcon: XCircle,
    badgeLabel: "Erreur",
  },
  warning: {
    card: "border-amber-300/50 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/10",
    iconWrap: "bg-amber-100 dark:bg-amber-950/30",
    icon: "text-amber-600 dark:text-amber-400",
    badgeVariant: "warning",
    badgeClass: "text-xs",
    badgeIcon: AlertCircle,
    badgeLabel: "Conflit",
  },
  success: {
    card: "border-border hover:border-primary/20",
    iconWrap: "bg-emerald-100 dark:bg-emerald-950/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    badgeVariant: "success",
    badgeClass: "text-xs",
    badgeIcon: CheckCircle2,
    badgeLabel: "Valide",
  },
} as const;

export function ScheduleSlotCard({
  slot,
  index,
  conflictData,
  onOpenConflictCourse,
  onRemove = () => {},
  onUpdate = () => {},
}: ScheduleSlotCardProps) {
  const isSlotTimeValid = isSlotValid(slot);
  const duration = getSlotDuration(slot.start_hour, slot.end_hour);
  const dayLabel =
    DAYS_OF_WEEK.find((d) => d.value === slot.day_of_week)?.label || "";
  const hasConflict = !!conflictData;
  const conflictMessage = conflictData?.message;
  const conflictingCourseId = conflictData?.conflictingCourseId;
  const slotStatus = getSlotStatus(slot, hasConflict);
  const statusConfig = STATUS_CONFIG[slotStatus];
  const BadgeIcon = statusConfig.badgeIcon;
  const startDateValue = (() => {
    const parsed = parseISO(slot.start_date);
    return isValidDate(parsed) ? format(parsed, "yyyy-MM-dd") : "";
  })();

  const handleStartHourChange = (val: string) => {
    const newStartHour = parseInt(val);
    const updates: Partial<RecurringScheduleSlot> = {
      start_hour: newStartHour,
    };
    // Auto-adjust end_hour if it would be invalid
    if (slot.end_hour <= newStartHour) {
      updates.end_hour = newStartHour + 1;
    }
    onUpdate(index, updates);
  };

  const handleEndHourChange = (val: string) => {
    const newEndHour = parseInt(val);
    const updates: Partial<RecurringScheduleSlot> = {
      end_hour: newEndHour,
    };
    // Auto-adjust start_hour if it would be invalid
    if (slot.start_hour >= newEndHour) {
      // Ensure start_hour doesn't go below 0
      updates.start_hour = Math.max(0, newEndHour - 1);
    }
    onUpdate(index, updates);
  };

  return (
    <Card className={cn("transition-all border-2", statusConfig.card)}>
      <CardContent className="">
        {/* Header with status badge and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "flex items-center justify-center size-10 rounded-lg",
                statusConfig.iconWrap,
              )}
            >
              <CalendarIcon className={cn("size-5", statusConfig.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap ">
                <span className="font-semibold text-base">
                  {dayLabel || "Jour non sélectionné"}
                </span>

                <Badge variant="outline" className="text-xs font-normal">
                  <Clock className="size-3 mr-1" />
                  {duration > 0 ? `${duration}h` : "0h"}
                </Badge>

                <Badge
                  variant={statusConfig.badgeVariant}
                  className={statusConfig.badgeClass}
                >
                  <BadgeIcon className="size-3 mr-1" />
                  {statusConfig.badgeLabel}
                </Badge>
              </div>
              {hasConflict && (
                <div className="flex gap-2 mt-1 items-center">
                  <p className="text-sm text-amber-700 dark:text-amber-300 ">
                    {conflictMessage}
                  </p>
                  {conflictingCourseId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `/courses/${conflictingCourseId}`,
                          "_blank",
                        );
                        onOpenConflictCourse?.();
                      }}
                      title="Ouvrir le cours en conflit"
                    >
                      <ExternalLink className="size-3 mr-1" />
                      Ouvrir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              onClick={() => onRemove(index)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Supprimer ce créneau"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Validation error message */}
        {!isSlotTimeValid && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4 border border-destructive/20">
            <AlertCircle className="size-4 shrink-0" />
            <span>L'heure de fin doit être après l'heure de début</span>
          </div>
        )}

        <Separator className="mb-4" />

        {/* Fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Jour</FieldLabel>
            <Select
              value={slot.day_of_week.toString()}
              onValueChange={(val) =>
                onUpdate(index, {
                  day_of_week: parseInt(val),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un jour" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Heure de début</FieldLabel>
            <Select
              value={slot.start_hour.toString()}
              onValueChange={handleStartHourChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une heure" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value.toString()}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Heure de fin</FieldLabel>
            <Select
              value={slot.end_hour.toString()}
              onValueChange={handleEndHourChange}
            >
              <SelectTrigger
                className={cn(!isSlotTimeValid && "border-destructive")}
              >
                <SelectValue placeholder="Choisir une heure" />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value.toString()}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Date field - Full width */}
        <div className="mt-4">
          <Field>
            <FieldLabel>Date de début</FieldLabel>
            <Input
              type="date"
              value={startDateValue}
              onChange={(e) => {
                const date = new Date(e.target.value);
                date.setHours(8, 0, 0, 0);
                onUpdate(index, {
                  start_date: date.toISOString(),
                });
              }}
              className="w-full"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
