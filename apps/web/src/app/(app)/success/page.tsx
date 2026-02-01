import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id: string }>;
}) {
  const params = await searchParams;
  const checkout_id = params.checkout_id;

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-muted bg-card p-8 text-center shadow-xl">
        <h1 className="mb-4 font-semibold text-2xl text-accent tracking-tight">
          Payment Successful!
        </h1>
        <p className="mb-6 text-muted-foreground">
          Thank you for your subscription. Your account has been upgraded.
        </p>

        {checkout_id && (
          <div className="mb-8 rounded-lg bg-secondary/50 p-4">
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
              Transaction ID
            </p>
            <p className="mt-1 truncate font-mono text-foreground text-sm">
              {checkout_id}
            </p>
          </div>
        )}

        <Link
          href="/dashboard"
          className={cn(
            buttonVariants(),
            "w-full bg-accent text-white hover:bg-accent/90",
          )}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
