import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-3",
      default: "size-4",
      lg: "size-6",
      xl: "size-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2
      data-slot="spinner"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };
