import * as React from "react";
import { cn } from "@/lib/utils";

// Field — main container with orientation and data-invalid support
function Field({
  className,
  orientation = "vertical",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "vertical" | "horizontal" | "responsive";
}) {
  return (
    <div
      data-slot="field"
      className={cn(
        "flex gap-2",
        orientation === "vertical" && "flex-col",
        orientation === "horizontal" && "flex-row items-center",
        orientation === "responsive" && "flex-col sm:flex-row sm:items-center",
        className,
      )}
      {...props}
    />
  );
}

// FieldContent — wraps controls
function FieldContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

// FieldDescription — muted helper text
function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

// FieldError — accepts errors array (NOT children)
// CRITICAL: must accept Array<{ message: string } | string | undefined> for TanStack Form compat
function FieldError({
  errors,
  className,
}: {
  errors: Array<{ message: string } | string | undefined>;
  className?: string;
}) {
  const validErrors = errors.filter(
    (error): error is { message: string } | string => error != null,
  );
  if (validErrors.length === 0) return null;
  return (
    <>
      {validErrors.map((error, index) => {
        const message = typeof error === "string" ? error : error.message;
        return (
          <p
            key={index}
            data-slot="field-error"
            className={cn("text-destructive text-xs font-medium", className)}
          >
            {message}
          </p>
        );
      })}
    </>
  );
}

// FieldGroup — groups multiple fields
function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

// FieldLabel — styled label
function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "font-body text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

// FieldLegend — fieldset legend
function FieldLegend({
  className,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) {
  return (
    <legend
      data-slot="field-legend"
      className={cn("font-body text-sm font-medium leading-none", className)}
      {...props}
    />
  );
}

// FieldSeparator — horizontal divider
function FieldSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      data-slot="field-separator"
      className={cn("border-border", className)}
      {...props}
    />
  );
}

// FieldSet — semantic fieldset wrapper
function FieldSet({
  className,
  ...props
}: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn("m-0 border-0 p-0", className)}
      {...props}
    />
  );
}

// FieldTitle — title text for field groups
function FieldTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="field-title"
      className={cn(
        "font-heading text-sm font-semibold uppercase tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
