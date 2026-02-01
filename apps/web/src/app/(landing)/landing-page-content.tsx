"use client";

import { LandingFooter } from "@/components/landing-footer";
import { SignupForm } from "@/components/signup-form";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const THESES = [
  {
    title: "The AI Cap-Ex Cycle",
    source: "The All-In Podcast #162",
    tag: "New",
    summary: {
      label: "Summary",
      color: "emerald",
      text: "Big tech is front-loading infrastructure spend to secure dominance in the AI era. Expect significant capital deployment in energy and data centers over the next 18 months.",
    },
    insight: {
      label: "Key Insight",
      color: "purple",
      text: 'Long-term bullish on semi-conductors and energy infrastructure providers. The "compute" bottleneck is shifting to "power".',
    },
  },
  {
    title: "Crypto Regulation Pivot",
    source: "Bankless #198",
    tag: "Trending",
    summary: {
      label: "Summary",
      color: "emerald",
      text: "Recent enforcement actions suggest a shift towards regulated DeFi. Institutions are waiting for clear custody rules before major entry.",
    },
    insight: {
      label: "Key Insight",
      color: "purple",
      text: "Expect a bifurcation of the market: Compliant KYC/AML chains vs. privacy-focused dark pools. Bet on infrastructure layers bridging the two.",
    },
  },
  {
    title: "Rates & Real Estate",
    source: "Odd Lots: Housing Special",
    tag: "Macro",
    summary: {
      label: "Summary",
      color: "emerald",
      text: "Commercial real estate refinancing walls are hitting just as rates stay higher for longer. Regional banks hold the majority of this debt.",
    },
    insight: {
      label: "Key Insight",
      color: "purple",
      text: "Distressed asset opportunities will emerge in Q3. Look for private credit funds specializing in bridge financing for quality assets.",
    },
  },
];

export function LandingPageContent() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-black selection:bg-emerald-500/30">
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        {/* Main Hero Card */}
        <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 lg:grid-cols-2">
          {/* Left Pane: Content */}
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 lg:py-20">
            <h1 className="font-sans font-semibold text-4xl text-white tracking-tight sm:text-5xl lg:text-5xl">
              We listen to financial podcasts so you don&apos;t have to
            </h1>
            <p className="mt-6 text-lg text-zinc-400">
              Investment ideas, trends, and expert takes — delivered to your
              inbox.
            </p>

            <div className="mt-10">
              <SignupForm />
            </div>
          </div>

          {/* Right Pane: Visual */}
          <div className="relative flex min-h-[500px] flex-col items-center justify-center bg-zinc-900 p-12 lg:min-h-full lg:p-24">
            {/* Background Effects Wrapper (Clipped) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/40 via-transparent to-transparent opacity-70" />

              {/* Texture/Noise Overlay */}
              <div
                className="absolute inset-0 opacity-20 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                }}
              />
            </div>

            {/* Carousel Container */}
            <div className="group relative z-20 w-full max-w-[550px]">
              <Carousel
                className="w-full overflow-visible"
                opts={{
                  loop: true,
                }}
              >
                <CarouselContent>
                  {THESES.map((thesis) => (
                    <CarouselItem key={thesis.title}>
                      <div className="p-1">
                        <div className="flex w-full flex-col rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl backdrop-blur-md sm:p-6">
                          <div className="mb-6 flex items-center justify-between border-white/5 border-b pb-4">
                            <span className="font-medium text-sm text-zinc-400">
                              Latest Report
                            </span>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-400 text-xs">
                              {thesis.tag}
                            </span>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <h3 className="font-semibold text-white text-xl">
                                {thesis.title}
                              </h3>
                              <div className="mt-2 flex items-center gap-2 text-indigo-400 text-sm">
                                <span className="font-medium">Source:</span>
                                <span className="text-zinc-400">
                                  {thesis.source}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4">
                              <div className="rounded-lg bg-zinc-900/50 p-4">
                                <span
                                  className={cn(
                                    "mb-1 block font-bold text-xs uppercase tracking-wider",
                                    thesis.summary.color === "emerald"
                                      ? "text-emerald-500"
                                      : "text-blue-500",
                                  )}
                                >
                                  {thesis.summary.label}
                                </span>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                  {thesis.summary.text}
                                </p>
                              </div>

                              <div className="rounded-lg bg-zinc-900/50 p-4">
                                <span
                                  className={cn(
                                    "mb-1 block font-bold text-xs uppercase tracking-wider",
                                    thesis.insight.color === "purple"
                                      ? "text-purple-400"
                                      : "text-orange-400",
                                  )}
                                >
                                  {thesis.insight.label}
                                </span>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                  {thesis.insight.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  variant="ghost"
                  className="pointer-events-auto -left-12 border-none bg-transparent text-white/50 opacity-0 transition-all hover:bg-transparent hover:text-white group-hover:opacity-100"
                />
                <CarouselNext
                  variant="ghost"
                  className="pointer-events-auto -right-12 border-none bg-transparent text-white/50 opacity-0 transition-all hover:bg-transparent hover:text-white group-hover:opacity-100"
                />
              </Carousel>
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
