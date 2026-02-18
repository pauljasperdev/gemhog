import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group"
    className={cn("flex items-stretch [&>*:not(:first-child)]:-ml-px", className)}
    {...props}
  />
))
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    data-slot="input-group-control"
    className={cn(
      "flex h-9 w-full border border-input bg-background px-3 py-1 font-body text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 relative z-10 focus-visible:z-20",
      className
    )}
    {...props}
  />
))
InputGroupInput.displayName = "InputGroupInput"

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "flex min-h-[60px] w-full border border-input bg-background px-3 py-2 font-body text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 relative z-10 focus-visible:z-20",
      className
    )}
    {...props}
  />
))
InputGroupTextarea.displayName = "InputGroupTextarea"

type InputGroupAddonProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end"
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "inline-start", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-group-addon"
      className={cn(
        "flex items-center border border-input bg-secondary px-3 text-muted-foreground text-sm",
        className
      )}
      {...props}
    />
  )
)
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group-button"
    className={cn(
      "flex items-center [&>button]:h-full [&>button]:border-0 [&>button]:border-l [&>button]:border-input",
      className
    )}
    {...props}
  />
))
InputGroupButton.displayName = "InputGroupButton"

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="input-group-text"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
InputGroupText.displayName = "InputGroupText"

export {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
}
