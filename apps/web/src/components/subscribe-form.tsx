"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { CircleCheck } from "./animate-ui/icons/circle-check";

type SubscribeStatus = "idle" | "subscribed" | "error";

function ErrorCard() {
  return (
    <div
      role={"alert"}
      className={cn(
        "rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive",
      )}
    >
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm opacity-90">Please try again.</p>
    </div>
  );
}
export function SubscribeForm() {
  const [status, setStatus] = useState<SubscribeStatus>("idle");

  const subscribe = useMutation({
    ...trpc.subscriber.subscribe.mutationOptions(),
    retry: 3,
    onMutate() {
      setStatus("subscribed");
      trackEvent(AnalyticsEvents.SUBSCRIBE_STARTED);
      form.reset();
      return undefined;
    },
    onError() {
      setStatus("error");
    },
    onSuccess() {
      trackEvent(AnalyticsEvents.SUBSCRIBE_COMPLETED);
    },
  });

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: z.object({
        email: z.email("Please enter a valid email address"),
      }),
    },
    onSubmit: ({ value }) => {
      subscribe.mutate(value);
    },
  });

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
            <Field
              className="flex-1 text-left"
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <Input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                size="pill"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                className={cn(
                  "border-muted bg-secondary/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/50",
                  field.state.meta.errors.length > 0 &&
                    "border-destructive/50 focus-visible:ring-destructive/50",
                )}
              />
              {field.state.meta.isTouched && !field.state.meta.isValid && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>

        <Button type="submit" variant="accent" size="pill" className="w-40">
          {status === "subscribed" ? (
            <CircleCheck
              className="size-6 text-primary"
              animate
              persistOnAnimateEnd
            />
          ) : (
            "Get the free newsletter"
          )}
        </Button>
      </form>

      <p className="mt-6 text-muted-foreground text-xs">
        By subscribing, you agree to receive our newsletter. Unsubscribe
        anytime.{" "}
        <Link href="/privacy" className={buttonVariants({ variant: "link" })}>
          Privacy Policy
        </Link>
      </p>
      {status === "error" ? <ErrorCard /> : null}
    </div>
  );
}
