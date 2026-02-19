import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Lesson } from "shared";

interface LessonCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson;
  onSave: (comments: { title: string; description: string }[]) => void;
}

export function LessonCommentsDialog({
  open,
  onOpenChange,
  lesson,
  onSave,
}: LessonCommentsDialogProps) {
  const [comments, setComments] = useState<
    { id: number; title: string; description: string }[]
  >(
    (lesson.comments ?? []).map((comment, index) => ({
      id: index,
      title: comment.title,
      description: comment.description,
    })),
  );

  const handleAdd = () => {
    setComments((prev) => [
      ...prev,
      { id: Date.now(), title: "", description: "" },
    ]);
  };

  const handleChange = (
    id: number,
    field: "title" | "description",
    value: string,
  ) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === id ? { ...comment, [field]: value } : comment,
      ),
    );
  };

  const handleDelete = (id: number) => {
    setComments((prev) => prev.filter((comment) => comment.id !== id));
  };

  const handleSave = () => {
    const filtered = comments.filter(
      (c) => c.title.trim().length > 0 || c.description.trim().length > 0,
    );
    onSave(
      filtered.map(({ title, description }) => ({
        title,
        description,
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Commentaires pour la leçon "{lesson.label}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun commentaire pour le moment. Ajoutez-en un pour noter des
              idées, rappels ou consignes.
            </p>
          )}

          {comments.map((comment) => (
            <div
              key={comment.id}
              className="space-y-2 rounded-md border border-border/60 bg-muted/10 p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Titre du commentaire"
                  value={comment.title}
                  onChange={(e) =>
                    handleChange(comment.id, "title", e.target.value)
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(comment.id)}
                  title="Supprimer le commentaire"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Contenu du commentaire..."
                value={comment.description}
                onChange={(e) =>
                  handleChange(comment.id, "description", e.target.value)
                }
                rows={3}
              />
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="size-4 mr-2" />
            Ajouter un commentaire
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
