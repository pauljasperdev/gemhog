"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { z } from "zod";

import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
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
      <output className="block text-emerald-400">
        Check your inbox to confirm your subscription.
      </output>
    );
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <form.Field name="email">
            {(field) => (
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="your@email.com"
                  aria-label="Email address"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="mt-2 text-red-400 text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <button
                type="submit"
                disabled={!state.canSubmit || state.isSubmitting}
                className="rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-50 sm:whitespace-nowrap"
              >
                {state.isSubmitting
                  ? "Subscribing..."
                  : "Get the free newsletter"}
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>

      {subscribe.isError && (
        <p role="alert" className="mt-2 text-red-400 text-sm">
          {subscribe.error?.message ??
            "Something went wrong. Please try again."}
        </p>
      )}

      <p className="mt-3 text-gray-500 text-xs">
        By subscribing, you agree to receive our newsletter. Unsubscribe
        anytime.{" "}
        <Link
          href="/privacy"
          className="underline transition-colors hover:text-gray-300"
        >
          Privacy Policy
        </Link>
      </p>
    </>
  );
}
