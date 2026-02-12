import { cn } from "@/lib/utils";

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function FieldError({
  errors,
  className,
}: {
  errors: Array<{ message: string } | string | undefined>;
  className?: string;
}) {
  return (
    <>
      {errors
        .filter((error): error is { message: string } | string => error != null)
        .map((error, index) => {
          const message = typeof error === "string" ? error : error.message;
          return (
            <p
              key={index}
              className={cn("text-destructive text-xs font-medium", className)}
            >
              {message}
            </p>
          );
        })}
    </>
  );
}

export { Field, FieldError };
