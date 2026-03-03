export function Section({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const headerClass =
    variant === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-foreground text-background";

  return (
    <div>
      <div className="mb-16 text-center">
        <h2
          className={`inline-block px-6 py-3 font-black font-heading text-3xl uppercase tracking-tight md:text-4xl ${headerClass}`}
          style={{
            border: "2px solid var(--foreground)",
            boxShadow:
              variant === "primary"
                ? "4px 4px 0 var(--foreground)"
                : "4px 4px 0 var(--primary)",
          }}
        >
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
