import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import * as z from "zod";

const commentSchema = z.object({
    title: z.string().optional(),
    description: z.string().min(1, "Le commentaire est requis"),
});

export type LessonCommentFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialComment?: {
        title?: string;
        description: string;
    };
    onSubmit: (comment: { title?: string; description: string }) => Promise<void> | void;
};

export function LessonCommentForm({
    open,
    onOpenChange,
    initialComment,
    onSubmit,
}: LessonCommentFormProps) {
    const form = useForm({
        defaultValues: {
            title: initialComment?.title || "",
            description: initialComment?.description || "",
        },
        validators: {
            onSubmit: commentSchema,
        },
        onSubmit: async ({ value }) => {
            await Promise.resolve(onSubmit(value));
            onOpenChange(false);
            form.reset();
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {initialComment
                            ? "Modifier le commentaire"
                            : "Ajouter un commentaire"}
                    </DialogTitle>
                    <DialogDescription>
                        Ajoutez vos notes et réflexions sur cette leçon
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <form.Field
                            name="title"
                            children={(field) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>
                                        Titre (optionnel)
                                    </FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Ex: Difficultés rencontrées"
                                    />
                                </Field>
                            )}
                        />

                        <form.Field
                            name="description"
                            children={(field) => {
                                const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;

                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Commentaire
                                        </FieldLabel>
                                        <Textarea
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Décrivez vos observations, difficultés rencontrées, points à améliorer..."
                                            rows={5}
                                        />
                                        {isInvalid && (
                                            <FieldError
                                                errors={field.state.meta.errors}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        />
                    </FieldGroup>

                    <DialogFooter>
                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
                            children={([canSubmit, isSubmitting]) => (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit || isSubmitting}
                                    >
                                        {isSubmitting
                                            ? "Enregistrement..."
                                            : initialComment
                                            ? "Modifier"
                                            : "Ajouter"}
                                    </Button>
                                </>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

