import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-none border-2 border-foreground bg-background px-3 py-1 font-body text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

function FormInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      className={cn(
        "h-12 bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input, FormInput };
