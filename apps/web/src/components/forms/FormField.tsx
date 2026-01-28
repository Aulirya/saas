import { FieldApi } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

/**
 * Reusable form field wrapper that handles common field logic
 */
interface BaseFieldProps<T> {
    field: FieldApi<any, any, undefined, T, T | undefined>;
    label: string;
    required?: boolean;
    description?: string;
}

/**
 * Formats error messages from TanStack Form errors
 */
function formatError(error: unknown): string {
    if (typeof error === "string") {
        return error;
    }
    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        return error.message;
    }
    return "Erreur de validation";
}

/**
 * Reusable Text Input Field Component
 */
export function TextField({
    field,
    label,
    required = false,
    description,
    placeholder,
    onValueChange,
}: BaseFieldProps<string> & {
    placeholder?: string;
    onValueChange?: (value: string) => void;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => {
                    const value = e.target.value;
                    field.handleChange(value);
                    onValueChange?.(value);
                }}
                onBlur={field.handleBlur}
                placeholder={placeholder}
                aria-invalid={isInvalid}
                required={required}
            />
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}

/**
 * Reusable Date Input Field Component
 */
export function DateField({
    field,
    label,
    required = false,
    description,
    onValueChange,
}: BaseFieldProps<string> & {
    onValueChange?: (value: string) => void;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
                id={field.name}
                type="date"
                name={field.name}
                value={field.state.value}
                onChange={(e) => {
                    const value = e.target.value;
                    field.handleChange(value);
                    onValueChange?.(value);
                }}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
                required={required}
            />
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}

/**
 * Reusable Textarea Field Component
 */
export function TextareaField({
    field,
    label,
    required = false,
    description,
    placeholder,
    rows = 3,
}: BaseFieldProps<string> & {
    placeholder?: string;
    rows?: number;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={placeholder}
                aria-invalid={isInvalid}
                rows={rows}
                required={required}
            />
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}

/**
 * Reusable Select Field Component
 */
export function SelectField<T extends string>({
    field,
    label,
    required = false,
    description,
    placeholder,
    options,
    getLabel,
    onValueChange,
}: BaseFieldProps<T> & {
    placeholder?: string;
    options: readonly T[] | T[];
    getLabel: (value: T) => string;
    onValueChange?: (value: T) => void;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Select
                value={field.state.value || undefined}
                onValueChange={(value) => {
                    field.handleChange(value as T);
                    field.handleBlur();
                    onValueChange?.(value as T);
                }}
            >
                <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {getLabel(option)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}

/**
 * Reusable Select Field Component with Clear/Unselect functionality
 * Shows a "clear" option when a value is selected, allowing users to unselect
 */
export function SelectFieldWithClear<T extends string>({
    field,
    label,
    required = false,
    description,
    placeholder,
    options,
    getLabel,
    clearLabel = "Effacer la sélection",
}: BaseFieldProps<T> & {
    placeholder?: string;
    options: readonly T[] | T[];
    getLabel: (value: T) => string;
    clearLabel?: string;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    // Convert empty string to undefined for proper placeholder display
    // Radix UI Select requires undefined (not empty string) to show placeholder
    const selectValue =
        field.state.value && field.state.value.trim() !== ""
            ? field.state.value
            : undefined;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Select
                key={`select-${field.name}-${selectValue || "empty"}`}
                value={selectValue}
                onValueChange={(value) => {
                    // Handle "clear" option
                    if (value === "__clear__") {
                        field.handleChange("" as T);
                    } else {
                        field.handleChange(value as T);
                    }
                    field.handleBlur();
                }}
            >
                <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {selectValue && (
                        <>
                            <SelectItem value="__clear__">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Trash2 className="size-4" />
                                    {clearLabel}
                                </span>
                            </SelectItem>
                            <SelectSeparator />
                        </>
                    )}
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {getLabel(option)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}

/**
 * Reusable Number Input Field Component
 */
export function NumberField({
    field,
    label,
    required = false,
    description,
    placeholder,
    min,
    max,
    step,
}: BaseFieldProps<number> & {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
                id={field.name}
                name={field.name}
                type="number"
                min={min}
                max={max}
                step={step}
                value={
                    field.state.value === 0 || field.state.value === undefined
                        ? ""
                        : field.state.value
                }
                onChange={(e) => {
                    const value = e.target.value;
                    field.handleChange(value === "" ? 0 : parseInt(value, 10));
                }}
                onBlur={field.handleBlur}
                placeholder={placeholder}
                aria-invalid={isInvalid}
                required={required}
            />
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}

/**
 * Reusable Checkbox List Field Component
 */
export function CheckboxListField<T extends { id: string; name: string }>({
    field,
    label,
    required = false,
    description,
    options,
    emptyMessage,
    maxHeight = "12rem",
}: BaseFieldProps<string[]> & {
    options: T[];
    emptyMessage?: string;
    maxHeight?: string;
}) {
    const isInvalid =
        field.state.meta.isTouched && field.state.meta.errors.length > 0;

    const currentValue = field.state.value ?? [];

    return (
        <Field data-invalid={isInvalid}>
            <FieldLabel>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div
                className="space-y-2 overflow-y-auto border rounded-md p-3"
                style={{ maxHeight }}
            >
                {options.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {emptyMessage || "Aucune option disponible."}
                    </p>
                ) : (
                    options.map((option) => {
                        const isChecked = currentValue.includes(option.id);
                        return (
                            <label
                                key={option.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            field.handleChange([
                                                ...currentValue,
                                                option.id,
                                            ]);
                                        } else {
                                            field.handleChange(
                                                currentValue.filter(
                                                    (id) => id !== option.id
                                                )
                                            );
                                        }
                                        field.handleBlur();
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm">{option.name}</span>
                            </label>
                        );
                    })
                )}
            </div>
            <FieldError>
                {field.state.meta.errors?.map(
                    (error: unknown, index: number) => (
                        <span key={index}>{formatError(error)}</span>
                    )
                )}
            </FieldError>
        </Field>
    );
}
