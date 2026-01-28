import { format } from "date-fns";
import {
  Edit,
  Upload,
  MessageSquare,
  FileText,
  Paperclip,
  X,
  Clock,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lesson, LessonStatus } from "shared";
import { cn } from "@/lib/utils";

import {
  getScopeConfig,
  getStatusConfig,
  LESSON_STATUS_CONFIG,
} from "@/lib/lesson-utils";

interface LessonCardProps {
  lesson: Lesson & { subject_name: string };
  estimatedTime: number;
  displayOrder: number;
  _showFakeData?: boolean;
  onEdit: () => void;
  onImport: () => void;
  onComment: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onStatusChange?: (status: LessonStatus) => void;
}

export function LessonCard({
  lesson,
  estimatedTime,
  displayOrder,
  _showFakeData = false,
  onEdit,
  onImport,
  onComment,
  onDelete,
  onMoveUp,
  onMoveDown,
  onStatusChange,
}: LessonCardProps) {
  // Determine lesson status
  const status = lesson.status ?? "to_do";
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // Get scope configuration for colors
  const scope = lesson.scope ?? "core";
  const scopeConfig = getScopeConfig(scope);
  const scopeColors = {
    bg: scopeConfig.color,
    text: scopeConfig.iconColor,
    border: scopeConfig.borderColor,
  };

  // Fake data for design preview
  const _hasFiles = _showFakeData;
  const _fakeFiles = [
    { name: "Cours_Chapitre_3.pdf", size: "2.4 MB" },
    { name: "Exercices_Complementaires.docx", size: "856 KB" },
  ];

  return (
    <div className="group flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 transition-all hover:border-border hover:bg-muted/30">
      {/* Main content */}
      <div className="flex flex-col gap-4 lg:flex-row-reverse sm:items-start sm:justify-between">
        <div className="flex shrink-0 items-center gap-1">
          {/* All lesson actions */}
          {onStatusChange ? (
            <Select
              value={status}
              onValueChange={(value) => {
                onStatusChange(value as LessonStatus);
              }}
            >
              <SelectTrigger
                className={cn(
                  badgeVariants({
                    variant: statusConfig.variant,
                  }),
                  "text-xs cursor-pointer h-auto w-auto px-3 py-1 gap-1.5 [&>svg:last-child]:hidden",
                )}
                size="sm"
              >
                <StatusIcon className="size-3 text-current" />
                <SelectValue>{statusConfig.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LESSON_STATUS_CONFIG).map(
                  ([statusValue, config]) => {
                    const StatusOptionIcon = config.icon;
                    return (
                      <SelectItem key={statusValue} value={statusValue}>
                        <div className="flex items-center gap-2">
                          <StatusOptionIcon className="size-3" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  },
                )}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={statusConfig.variant} className="text-xs">
              <StatusIcon className="size-3 text-current" />
              {statusConfig.label}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMoveUp}
            className="h-8 w-8"
            title="Monter la leçon"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMoveDown}
            className="h-8 w-8"
            title="Descendre la leçon"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            className="h-8 w-8"
            title="Modifier la leçon"
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onImport}
            className="h-8 w-8"
            title="Importer du contenu"
          >
            <Upload className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onComment}
            className="h-8 w-8"
            title="Ajouter un commentaire"
          >
            <MessageSquare className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Supprimer la leçon"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${scopeColors.bg} ${scopeColors.border}`}
            >
              <span className={`text-lg font-semibold ${scopeColors.text}`}>
                {displayOrder}
              </span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground leading-tight">
                  {lesson.label}
                </h4>
                <p
                  className={`text-xs ${scopeColors.border} ${scopeColors.text} self-end`}
                >
                  {getScopeConfig(scope).label}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {estimatedTime > 0 && (
                  <>
                    <Clock className="size-4" /> {estimatedTime} minutes
                  </>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-4" />
                  {lesson?.comments?.length ?? 0}
                </span>
                {_hasFiles && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="size-4" />
                    {_fakeFiles.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {lesson?.comments?.length > 0 &&
        lesson?.comments?.map((comment, index) => (
          <div
            key={`${comment.title}-${comment.created_at}-${index}`}
            className="flex items-start gap-3 rounded-md bg-background/50 border border-border/40 p-3"
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="size-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">
                  {comment.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(comment.created_at, "dd/MM/yyyy")}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.description}</p>
            </div>
          </div>
        ))}

      {/* Files section */}
      {_hasFiles && _fakeFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Paperclip className="size-3.5" />
            <span className="font-medium">Fichiers joints:</span>
          </div>
          {_fakeFiles.map((file, index) => (
            <div
              key={index}
              className="group/file flex items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-1.5 hover:bg-accent transition-colors"
            >
              <FileText className="size-3.5 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs text-foreground truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({file.size})
                </span>
              </div>
              <button
                className="opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Remove file", file.name);
                }}
                title="Supprimer le fichier"
              >
                <X className="size-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
