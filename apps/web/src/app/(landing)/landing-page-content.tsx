"use client";

import { LandingFooter } from "@/components/landing-footer";
import { SubscribeForm } from "@/components/subscribe-form";
import { ThesisCarousel } from "./thesis-carousel";

export function LandingPageContent() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background selection:bg-accent/30">
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        {/* Main Hero Card */}
        <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-muted bg-card lg:grid-cols-2">
          {/* Left Pane: Content */}
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 lg:py-20">
            <h1 className="font-sans font-semibold text-4xl text-foreground tracking-tight sm:text-5xl lg:text-5xl">
              We listen to financial podcasts so you don&apos;t have to
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Investment ideas, trends, and expert takes — delivered to your
              inbox.
            </p>

            <div className="mt-10">
              <SubscribeForm />
            </div>
          </div>

          {/* Right Pane: Visual */}
          <ThesisCarousel />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
