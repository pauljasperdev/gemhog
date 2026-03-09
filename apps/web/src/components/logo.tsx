export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={`flex aspect-square size-8 items-center justify-center rounded-lg bg-primary font-bold font-heading text-background text-sm leading-none tracking-tight ${className ?? ""}`}
    >
      GH
    </div>
  );
}
