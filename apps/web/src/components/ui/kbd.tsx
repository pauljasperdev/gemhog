import * as React from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center justify-center font-mono text-xs bg-secondary text-secondary-foreground border-2 border-input px-1.5 py-0.5 min-w-[1.5rem]",
        className,
      )}
      {...props}
    />
  );
}

type KbdGroupProps = React.HTMLAttributes<HTMLSpanElement> & {
  separator?: string;
};

function KbdGroup({
  className,
  separator = "+",
  children,
  ...props
}: KbdGroupProps) {
  const childArray = React.Children.toArray(children);
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-0.5", className)}
      {...props}
    >
      {childArray.map((child, i) => (
        <React.Fragment key={(child as React.ReactElement).key}>
          {i > 0 && (
            <span className="text-muted-foreground text-xs">{separator}</span>
          )}
          {child}
        </React.Fragment>
      ))}
    </span>
  );
}

export { Kbd, KbdGroup };
