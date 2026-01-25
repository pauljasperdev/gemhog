"use client";

import * as Sentry from "@sentry/nextjs";
import type { ReactNode } from "react";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  section?: string;
  fallback?: ReactNode;
}

/**
 * Reusable error boundary for UI sections.
 * Wraps content in Sentry.ErrorBoundary to capture errors without taking down the whole page.
 *
 * @example
 * ```tsx
 * <SectionErrorBoundary section="dashboard-chart">
 *   <ChartComponent />
 * </SectionErrorBoundary>
 * ```
 */
export function SectionErrorBoundary({
  children,
  section,
  fallback,
}: SectionErrorBoundaryProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        if (section) {
          scope.setTag("section", section);
        }
      }}
      fallback={({ error, resetError }) =>
        fallback || (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
            <h3 className="font-medium text-foreground">
              This section encountered an error
            </h3>
            <button
              type="button"
              onClick={resetError}
              className="mt-2 rounded bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:bg-primary/90"
            >
              Try again
            </button>
            {isDev && (
              <pre className="mt-4 max-h-48 overflow-auto rounded bg-destructive/10 p-2 text-left text-destructive text-xs">
                {error.message}
                {"\n\n"}
                {error.stack}
              </pre>
            )}
          </div>
        )
      }
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
