"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type SubscribeStatus = "idle" | "subscribed" | "error";

function StatusCard({
  variant,
  title,
  children,
}: {
  variant: "success" | "error";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={cn(
        "rounded-lg border p-4",
        variant === "success"
          ? "border-accent/20 bg-accent/10 text-chart-4"
          : "border-destructive/20 bg-destructive/10 text-destructive",
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm opacity-90">{children}</p>
    </div>
  );
}

export function SignupForm() {
  const [status, setStatus] = useState<SubscribeStatus>("idle");

  const subscribe = useMutation({
    ...trpc.subscriber.subscribe.mutationOptions(),
    retry: 3,
    onMutate: () => {
      setStatus("subscribed");
    },
    onError: () => {
      setStatus("error");
    },
  });

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

  return status === "idle" ? (
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
                size="pill"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={cn(
                  "border-muted bg-secondary/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/50",
                  field.state.meta.errors.length > 0 &&
                    "border-destructive/50 focus-visible:ring-destructive/50",
                )}
              />
              {field.state.meta.errors.map((error) => (
                <p
                  key={error?.message}
                  className="mt-2 pl-1 text-destructive text-sm"
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
              variant="accent"
              size="pill"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              Get the free newsletter
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-muted-foreground text-xs">
        By subscribing, you agree to receive our newsletter. Unsubscribe
        anytime.{" "}
        <Link href="/privacy" className={buttonVariants({ variant: "link" })}>
          Privacy Policy
        </Link>
      </p>
    </div>
  ) : status === "subscribed" ? (
    <StatusCard variant="success" title="Success!">
      {subscribe.data?.message ?? "Check your inbox to confirm your subscription."}
    </StatusCard>
  ) : (
    <StatusCard variant="error" title="Something went wrong">
      {subscribe.error?.message ?? "Please try again."}
    </StatusCard>
  );
}
