import { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/orpc/client";
import { getClassLevelsForCountry } from "shared";
import { useCurrentUser } from "@/features/classes/api/useSchoolClasses";

import { FormSheet } from "@/components/ui/form-sheet";
import { SheetClose } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import {
  TextField,
  SelectField,
  NumberField,
  CheckboxListField,
} from "@/components/forms";
import { school_class_create_input } from "shared";
import {
  useSchools,
  useSubjects,
} from "@/features/classes/api/useSchoolClasses";

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    name: string;
    level: string;
    school: string;
    students_count: number;
    subjects?: string[];
  };
}

export function ClassFormModal({
  open,
  onOpenChange,
  initialData,
}: ClassFormModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialData;

  // Fetch existing schools and levels from database
  const { data: existingSchools = [] } = useSchools();
  const { data: availableSubjects = [] } = useSubjects();
  const { data: currentUser } = useCurrentUser();

  // Get country-specific class levels
  const classLevels = useMemo(() => {
    return getClassLevelsForCountry(currentUser?.country);
  }, [currentUser?.country]);

  // ---------- Form ----------
  const form = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      level: initialData?.level ?? "",
      school: initialData?.school ?? "",
      students_count: initialData?.students_count ?? 0,
      subjects: initialData?.subjects ?? ([] as string[]),
    },
    validators: {
      onSubmit: ({ value }) => {
        // Transform form value to match schema (subjects is optional in schema)
        const transformedValue = {
          ...value,
          subjects:
            value.subjects && value.subjects.length > 0
              ? value.subjects
              : undefined,
        };
        const result = school_class_create_input.safeParse(transformedValue);

        // TanStack Form expects undefined on success, or an error object on failure
        if (!result.success) {
          return result.error.format();
        }
        // Return undefined to indicate validation passed
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      proceedWithSubmission(value);
    },
  });

  // ---------- Success Handler ----------
  function handleSuccess(message: string) {
    // Invalidate all related queries to refresh the lists
    queryClient.invalidateQueries({ queryKey: ["schoolClasses"] });
    queryClient.invalidateQueries({ queryKey: ["school-classes"] });
    queryClient.invalidateQueries({
      queryKey: orpc.schoolClass.listSchools.queryKey({}),
    });
    queryClient.invalidateQueries({
      queryKey: orpc.schoolClass.listLevels.queryKey({}),
    });

    // If editing, invalidate the specific class queries
    if (isEditMode && initialData?.id) {
      queryClient.invalidateQueries({
        queryKey: orpc.schoolClass.getWithSubjects.queryKey({
          input: { id: initialData.id },
        }),
      });
    }

    toast.success(message);
    form.reset();
    onOpenChange(false);
  }

  // ---------- Mutations ----------
  const { mutate: createClass } = useMutation({
    mutationFn: async (data: {
      name: string;
      level: string;
      school: string;
      students_count: number;
      subjects?: string[];
    }) => {
      return await orpc.schoolClass.create.call(data);
    },
    onSuccess: () => {
      handleSuccess("Classe créée avec succès");
    },
    onError: (error) => {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création de la classe";
      toast.error(errorMsg);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const { mutate: updateClass } = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      level: string;
      school: string;
      students_count: number;
      subjects?: string[];
    }) => {
      return await orpc.schoolClass.patch.call(data);
    },
    onSuccess: () => {
      handleSuccess("Classe modifiée avec succès");
    },
    onError: (error) => {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la modification de la classe";
      toast.error(errorMsg);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Helper function to proceed with submission
  const proceedWithSubmission = async (value: {
    name: string;
    level: string;
    school: string;
    students_count: number;
    subjects?: string[];
  }) => {
    setIsSubmitting(true);

    if (isEditMode && initialData) {
      // Check if anything changed
      if (
        initialData.name === value.name &&
        initialData.level === value.level &&
        initialData.school === value.school &&
        initialData.students_count === value.students_count &&
        JSON.stringify(initialData.subjects?.sort()) ===
          JSON.stringify((value.subjects ?? []).sort())
      ) {
        toast.info("Aucune modification détectée");
        setIsSubmitting(false);
        return;
      }

      updateClass({
        id: initialData.id,
        name: value.name,
        level: value.level,
        school: value.school,
        students_count: value.students_count,
        subjects:
          value.subjects && value.subjects.length > 0
            ? value.subjects
            : undefined,
      });
    } else {
      createClass({
        name: value.name,
        level: value.level,
        school: value.school,
        students_count: value.students_count,
        subjects:
          value.subjects && value.subjects.length > 0
            ? value.subjects
            : undefined,
      });
    }
  };

  const handleClose = (shouldClose: boolean) => {
    if (shouldClose && !isSubmitting) {
      form.reset();
    }
    onOpenChange(shouldClose);
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Modifier la classe" : "Créer une nouvelle classe"}
      children={
        <form
          id="create-class-form"
          className="overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            {/* Class Name */}
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Le nom est requis";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <TextField
                    field={field}
                    label="Nom de la classe"
                    placeholder="Ex: Terminale S1"
                    aria-invalid={isInvalid}
                  />
                );
              }}
            />

            {/* Level */}
            <form.Field
              name="level"
              validators={{
                onChange: ({ value }) => {
                  if (!value) {
                    return "Le niveau est requis";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <SelectField
                    field={field}
                    label="Niveau"
                    placeholder="Sélectionner un niveau"
                    aria-invalid={isInvalid}
                    options={classLevels}
                    getLabel={(level) => level}
                  />
                );
              }}
            />

            {/* School */}
            <form.Field
              name="school"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "L'établissement est requis";
                  }
                  return undefined;
                },
              }}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0;

                return (
                  <div>
                    <TextField
                      field={field}
                      label="Établissement"
                      placeholder="Ex: Lycée Jean Moulin"
                      aria-invalid={isInvalid}
                    />
                    {existingSchools.length > 0 && (
                      <datalist id={`${field.name}-list`}>
                        {existingSchools.map((school) => (
                          <option key={school} value={school} />
                        ))}
                      </datalist>
                    )}
                  </div>
                );
              }}
            />

            {/* Students Count */}
            <form.Field
              name="students_count"
              validators={{
                onChange: ({ value }) => {
                  if (value < 1) {
                    return "Le nombre d'élèves doit être supérieur à 0";
                  }
                  return undefined;
                },
              }}
              children={(field) => (
                <NumberField
                  field={field}
                  label="Nombre d'élèves"
                  placeholder="Ex: 32"
                  min={1}
                />
              )}
            />

            {/* Subjects Selection */}
            <form.Field
              name="subjects"
              children={(field) => (
                <CheckboxListField
                  field={field}
                  label="Matières (optionnel)"
                  options={availableSubjects}
                  emptyMessage="Aucune matière disponible. Créez d'abord des matières."
                  maxHeight="12rem"
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
                    type="reset"
                    onClick={(e) => {
                      // Avoid unexpected resets of form elements (especially <select> elements)
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
                    form="create-class-form"
                    disabled={!canSubmit || !form.state.isValid}
                  >
                    {isSubmitting
                      ? isEditMode
                        ? "Modification..."
                        : "Création..."
                      : isEditMode
                        ? "Modifier la classe"
                        : "Créer la classe"}
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
