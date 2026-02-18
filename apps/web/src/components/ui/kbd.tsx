import * as React from "react"
import { cn } from "@/lib/utils"

const Kbd = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <kbd
    ref={ref}
    data-slot="kbd"
    className={cn(
      "inline-flex items-center justify-center font-mono text-xs bg-secondary text-secondary-foreground border border-input px-1.5 py-0.5 min-w-[1.5rem]",
      className
    )}
    {...props}
  />
))
Kbd.displayName = "Kbd"

type KbdGroupProps = React.HTMLAttributes<HTMLSpanElement> & {
  separator?: string
}

const KbdGroup = React.forwardRef<HTMLSpanElement, KbdGroupProps>(
  ({ className, separator = "+", children, ...props }, ref) => {
    const childArray = React.Children.toArray(children)
    return (
      <span
        ref={ref}
        data-slot="kbd-group"
        className={cn("inline-flex items-center gap-0.5", className)}
        {...props}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-muted-foreground text-xs">{separator}</span>
            )}
            {child}
          </React.Fragment>
        ))}
      </span>
    )
  }
)
KbdGroup.displayName = "KbdGroup"

export { Kbd, KbdGroup }
