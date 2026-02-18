import * as React from "react"
import { cn } from "@/lib/utils"

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    data-slot="native-select"
    className={cn(
      "flex h-9 w-full border border-input bg-background px-3 py-1 font-body text-sm shadow-sm transition-colors",
      "appearance-none cursor-pointer",
      "text-foreground",
      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23e0e0e0%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]",
      "bg-no-repeat bg-[right_0.75rem_center] pr-8",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-destructive",
      className
    )}
    {...props}
  />
))
NativeSelect.displayName = "NativeSelect"

const NativeSelectOption = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option
    ref={ref}
    data-slot="native-select-option"
    className={cn("bg-background text-foreground", className)}
    {...props}
  />
))
NativeSelectOption.displayName = "NativeSelectOption"

type NativeSelectOptGroupProps = React.OptgroupHTMLAttributes<HTMLOptGroupElement>

const NativeSelectOptGroup = React.forwardRef<
  HTMLOptGroupElement,
  NativeSelectOptGroupProps
>(({ className, ...props }, ref) => (
  <optgroup
    ref={ref}
    data-slot="native-select-opt-group"
    className={cn("bg-background text-muted-foreground", className)}
    {...props}
  />
))
NativeSelectOptGroup.displayName = "NativeSelectOptGroup"

export { NativeSelect, NativeSelectOption, NativeSelectOptGroup }
