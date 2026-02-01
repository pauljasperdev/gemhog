"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { route: "app" },
    });
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="font-semibold text-foreground text-xl">
          Something went wrong
        </h2>
        <p className="mt-2 text-muted-foreground">
          We've been notified and are working on a fix.
        </p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-6 max-h-64 overflow-auto rounded bg-destructive/10 p-4 text-left text-destructive text-xs">
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
        )}
      </div>
    </div>
  );
}
