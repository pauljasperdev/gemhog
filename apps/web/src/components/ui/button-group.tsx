import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: ButtonGroupProps) {
  return (
    <div
      data-slot="button-group"
      className={cn(
        "flex",
        orientation === "horizontal" &&
          "flex-row [&>*:not(:first-child)]:-ml-px",
        orientation === "vertical" && "flex-col [&>*:not(:first-child)]:-mt-px",
        className,
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="button-group-separator"
      className={cn("border-l-2 border-border", className)}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="button-group-text"
      className={cn(
        "flex items-center border-2 border-input bg-secondary px-3 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };
