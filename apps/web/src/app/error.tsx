"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="font-semibold text-foreground text-xl">
          Something went wrong
        </h2>
        <p className="mt-2 text-muted-foreground">
          We've been notified and are working on a fix.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        {isDev && (
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
