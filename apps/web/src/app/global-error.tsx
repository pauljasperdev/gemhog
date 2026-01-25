"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md text-center">
            <h1 className="font-bold text-2xl text-foreground">
              Something went wrong
            </h1>
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
      </body>
    </html>
  );
}
