"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { trpc } from "@/trpc/client";
import { CircleCheck } from "./animate-ui/icons/circle-check";

type SubscribeStatus = "idle" | "subscribed" | "error";

function SuccessCard() {
  return (
    <div className="flex items-center gap-4 border border-primary/20 bg-primary/5 px-6 py-4">
      <CircleCheck
        className="size-7 shrink-0 text-primary"
        animate
        persistOnAnimateEnd
      />
      <div>
        <p className="font-heading font-medium text-foreground text-sm uppercase tracking-wide">
          Check your inbox
        </p>
        <p className="text-muted-foreground text-xs">
          You&apos;re on the waitlist.
        </p>
      </div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div
      role="alert"
      className="flex items-center gap-4 border border-destructive/20 bg-destructive/5 px-6 py-4"
    >
      <div className="flex size-7 shrink-0 items-center justify-center border border-destructive/40 bg-destructive/10">
        <span className="font-bold text-destructive text-xs">!</span>
      </div>
      <div>
        <p className="font-heading font-medium text-destructive text-sm uppercase tracking-wide">
          Something went wrong
        </p>
        <p className="text-muted-foreground text-xs">Please try again.</p>
      </div>
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
    <div className="w-full max-w-md">
      {status === "subscribed" ? (
        <SuccessCard />
      ) : status === "error" ? (
        <ErrorCard />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
          className="flex flex-col gap-2"
        >
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      aria-label="Email address"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      className="h-12 flex-1 rounded-none border-foreground/20 bg-secondary/50 px-6 text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/50"
                    />
                    <Button
                      type="submit"
                      className="h-12 w-36 shrink-0 rounded-none px-8 font-heading text-sm tracking-wide"
                    >
                      Join Waitlist
                    </Button>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </form>
      )}
    </div>
  );
}
