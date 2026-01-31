"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function SignupForm() {
  const subscribe = useMutation(trpc.subscriber.subscribe.mutationOptions());

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: z.object({
        email: z.email("Please enter a valid email address"),
      }),
    },
    onSubmit: async ({ value }) => {
      trackEvent(AnalyticsEvents.SIGNUP_STARTED);
      await subscribe.mutateAsync(value);
      trackEvent(AnalyticsEvents.SIGNUP_COMPLETED);
    },
  });

  if (subscribe.isSuccess) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
        <p className="font-medium">Success!</p>
        <p className="text-sm opacity-90">
          Check your inbox to confirm your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <form.Field name="email">
          {(field) => (
            <div className="flex-1 text-left">
              <Input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(
                  "h-12 border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500/50",
                  field.state.meta.errors.length > 0 &&
                    "border-red-500/50 focus-visible:ring-red-500/50",
                )}
              />
              {field.state.meta.errors.map((error) => (
                <p
                  key={error?.message}
                  className="mt-2 pl-1 text-red-400 text-sm"
                >
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              size="lg"
              disabled={!state.canSubmit || state.isSubmitting}
              className="h-12 border border-emerald-500/20 bg-emerald-600 px-8 font-medium text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] transition-all hover:bg-emerald-500 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)]"
            >
              {state.isSubmitting ? "Joining..." : "Join Waitlist"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      {subscribe.isError && (
        <p role="alert" className="mt-4 text-red-400 text-sm">
          {subscribe.error?.message ??
            "Something went wrong. Please try again."}
        </p>
      )}

      <p className="mt-6 text-xs text-zinc-500">
        By subscribing, you agree to receive our newsletter. Unsubscribe
        anytime.{" "}
        <Link
          href="/privacy"
          className="underline transition-colors hover:text-zinc-300"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
