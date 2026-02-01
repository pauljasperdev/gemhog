"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ThesisCard } from "./thesis-card";

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

export function ThesisCarousel() {
  return (
    <div className="relative flex min-h-[500px] flex-col items-center justify-center bg-secondary p-12 lg:min-h-full lg:p-24">
      {/* Background Effects Wrapper (Clipped) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 via-chart-5/20 to-chart-1/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/40 via-transparent to-transparent opacity-70" />

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
                <ThesisCard {...thesis} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            variant="ghost"
            className="pointer-events-auto -left-12 border-none bg-transparent text-foreground/50 opacity-0 transition-all hover:bg-transparent hover:text-foreground group-hover:opacity-100"
          />
          <CarouselNext
            variant="ghost"
            className="pointer-events-auto -right-12 border-none bg-transparent text-foreground/50 opacity-0 transition-all hover:bg-transparent hover:text-foreground group-hover:opacity-100"
          />
        </Carousel>
      </div>
    </div>
  );
}
