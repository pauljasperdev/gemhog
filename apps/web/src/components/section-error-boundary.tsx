"use client";

import * as Sentry from "@sentry/nextjs";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  section?: string;
  fallback?: ReactElement;
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
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        if (section) {
          scope.setTag("section", section);
        }
      }}
      fallback={({ error, resetError }) => {
        const err = error instanceof Error ? error : new Error(String(error));
        if (fallback) {
          return fallback;
        }
        return (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
            <h3 className="font-medium text-foreground">
              This section encountered an error
            </h3>
            <Button onClick={resetError} size="sm" className="mt-2">
              Try again
            </Button>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 max-h-48 overflow-auto rounded bg-destructive/10 p-2 text-left text-destructive text-xs">
                {err.message}
                {"\n\n"}
                {err.stack}
              </pre>
            )}
          </div>
        );
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
