"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { queryClient } from "@/trpc/client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

const ReactQueryDevtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (mod) => mod.ReactQueryDevtools,
    ),
  { ssr: false },
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      disableTransitionOnChange
    >
      <PostHogProvider client={posthog}>{content}</PostHogProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
