import * as React from "react"
import { cn } from "@/lib/utils"

// Field — main container with orientation and data-invalid support
const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "vertical" | "horizontal" | "responsive"
  }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field"
    className={cn(
      "flex gap-2",
      orientation === "vertical" && "flex-col",
      orientation === "horizontal" && "flex-row items-center",
      orientation === "responsive" && "flex-col sm:flex-row sm:items-center",
      className
    )}
    {...props}
  />
))
Field.displayName = "Field"

// FieldContent — wraps controls
const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-content"
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
))
FieldContent.displayName = "FieldContent"

// FieldDescription — muted helper text
const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="field-description"
    className={cn("text-muted-foreground text-sm", className)}
    {...props}
  />
))
FieldDescription.displayName = "FieldDescription"

// FieldError — accepts errors array (NOT children)
// CRITICAL: must accept Array<{ message: string } | string | undefined> for TanStack Form compat
function FieldError({
  errors,
  className,
}: {
  errors: Array<{ message: string } | string | undefined>
  className?: string
}) {
  const validErrors = errors.filter(
    (error): error is { message: string } | string => error != null
  )
  if (validErrors.length === 0) return null
  return (
    <>
      {validErrors.map((error, index) => {
        const message = typeof error === "string" ? error : error.message
        return (
          <p
            key={index}
            data-slot="field-error"
            className={cn("text-destructive text-xs font-medium", className)}
          >
            {message}
          </p>
        )
      })}
    </>
  )
}
FieldError.displayName = "FieldError"

// FieldGroup — groups multiple fields
const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field-group"
    className={cn("flex flex-col gap-4", className)}
    {...props}
  />
))
FieldGroup.displayName = "FieldGroup"

// FieldLabel — styled label
const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    data-slot="field-label"
    className={cn(
      "font-body text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
FieldLabel.displayName = "FieldLabel"

// FieldLegend — fieldset legend
const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.HTMLAttributes<HTMLLegendElement>
>(({ className, ...props }, ref) => (
  <legend
    ref={ref}
    data-slot="field-legend"
    className={cn("font-body text-sm font-medium leading-none", className)}
    {...props}
  />
))
FieldLegend.displayName = "FieldLegend"

// FieldSeparator — horizontal divider
const FieldSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    data-slot="field-separator"
    className={cn("border-border", className)}
    {...props}
  />
))
FieldSeparator.displayName = "FieldSeparator"

// FieldSet — semantic fieldset wrapper
const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
  <fieldset
    ref={ref}
    data-slot="field-set"
    className={cn("m-0 border-0 p-0", className)}
    {...props}
  />
))
FieldSet.displayName = "FieldSet"

// FieldTitle — title text for field groups
const FieldTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="field-title"
    className={cn("font-heading text-sm font-semibold uppercase tracking-wide", className)}
    {...props}
  />
))
FieldTitle.displayName = "FieldTitle"

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
}
