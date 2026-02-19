import * as React from "react";
import { cn } from "@/lib/utils";

function InputGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex items-stretch [&>*:not(:first-child)]:-ml-px",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input-group-control"
      className={cn(
        "flex h-9 w-full border border-input bg-background px-3 py-1 font-body text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 relative z-10 focus-visible:z-20",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-slot="input-group-control"
      className={cn(
        "flex min-h-[60px] w-full border border-input bg-background px-3 py-2 font-body text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 relative z-10 focus-visible:z-20",
        className,
      )}
      {...props}
    />
  );
}

type InputGroupAddonProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
};

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex items-center border border-input bg-secondary px-3 text-muted-foreground text-sm",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="input-group-button"
      className={cn(
        "flex items-center [&>button]:h-full [&>button]:border-0 [&>button]:border-l [&>button]:border-input",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupText({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="input-group-text"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
};
