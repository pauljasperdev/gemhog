"use client";

import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { SubscribeForm } from "@/components/subscribe-form";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between border-primary/20 border-b px-6 py-6 md:px-12">
        <div className="font-bold font-heading text-foreground text-lg uppercase tracking-tight">
          Gemhog<span className="text-primary">.</span>
        </div>
        <div className="hidden items-center gap-8 font-heading md:flex">
          <a
            href="#features"
            className="text-[#666] text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-primary"
          >
            Features
          </a>
          <a
            href="#process"
            className="text-[#666] text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-primary"
          >
            Process
          </a>
          <a
            href="#proof"
            className="text-[#666] text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-primary"
          >
            Proof
          </a>
        </div>
        <a
          href="/sign-in"
          className="border border-primary px-5 py-2.5 font-heading font-semibold text-[11px] text-primary uppercase tracking-widest transition-colors hover:border-foreground hover:text-foreground"
        >
          Sign In
        </a>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-1 items-center justify-center px-6 py-16 md:px-12">
        <div className="relative w-full max-w-6xl border border-border bg-card p-8 md:p-14">
          {/*
          <div className="mb-10 inline-block border border-primary px-4 py-1 font-bold font-heading text-[10px] text-primary uppercase tracking-[0.25em]">
            Podcast Intelligence
          </div>
          */}
          <h1 className="mb-10 max-w-5xl font-bold font-heading text-3xl text-foreground uppercase leading-[1.02] tracking-tight md:text-5xl lg:text-[4.5rem]">
            We listen to{" "}
            <span className="text-primary">investment podcasts</span> so you
            don&apos;t have to
          </h1>
          <div className="max-w-xl">
            <h2 className="mb-10 font-normal text-lg text-muted-foreground leading-relaxed">
              Investment ideas, trends, and expert takes — delivered to your
              inbox.
            </h2>
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/*
      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { v: "200+", l: "Podcasts Monitored" },
            { v: "12,847", l: "Picks Extracted" },
            { v: "48H", l: "Early Signal" },
            { v: "5MIN", l: "Daily Briefing" },
          ].map((s) => (
            <div key={s.v} className="border border-border bg-card p-6">
              <div className="font-bold font-heading text-3xl text-primary tabular-nums tracking-tight md:text-4xl">
                {s.v}
              </div>
              <div className="mt-2 text-[#555] text-xs italic tracking-wide">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <span className="font-heading font-semibold text-[10px] text-primary uppercase tracking-[0.3em]">
              What We Do
            </span>
            <div className="mt-3 w-12 border-primary border-t" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
               {
                 n: "001",
                 title: "EXTRACT",
                 desc: "We scan over 200 investment podcasts weekly. Every stock mention, conviction level, and investment thesis is carefully captured and catalogued.",
               },
              {
                n: "002",
                title: "ENRICH",
                desc: "Each pick is matched with live financial data - analyst ratings, price targets, earnings dates, and historical performance for complete context.",
              },
              {
                n: "003",
                title: "DETECT",
                desc: "Our system identifies emerging picks 24-48 hours before they surface on mainstream media or begin trending across social platforms.",
              },
              {
                n: "004",
                title: "DELIVER",
                desc: "A five-minute morning briefing tailored to your interests. No noise, no fluff - just the picks, data, and context that matter.",
              },
            ].map((f) => (
              <div
                key={f.n}
                className="border border-border bg-card p-8 transition-colors duration-300 hover:border-primary md:p-10"
              >
                <div className="mb-5 font-semibold text-[10px] text-primary tracking-[0.3em]">
                  {f.n}
                </div>
                <h3 className="mb-4 font-bold font-heading text-foreground text-xl uppercase tracking-tight md:text-2xl">
                  {f.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <span className="font-heading font-semibold text-[10px] text-primary uppercase tracking-[0.3em]">
              How It Works
            </span>
            <div className="mt-3 w-12 border-primary border-t" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                step: "STEP 01",
                title: "Sign up for free",
                desc: "No credit card required. Takes thirty seconds. Select the topics and sectors that interest you.",
              },
              {
                step: "STEP 02",
                title: "We do the listening",
                desc: "Over 200 podcasts monitored continuously. Picks extracted, data paired, emerging signals identified in real time.",
              },
              {
                step: "STEP 03",
                title: "You make better decisions",
                desc: "Open your five-minute morning briefing. Act on curated insights before the rest of the market catches on.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="border border-border bg-card p-8 transition-colors hover:border-primary"
              >
                <span className="mb-3 block font-bold font-heading text-[#555] text-[10px] uppercase tracking-[0.3em]">
                  {s.step}
                </span>
                <h3 className="mb-2 font-bold font-heading text-foreground text-lg uppercase tracking-tight">
                  {s.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <span className="font-heading font-semibold text-[10px] text-primary uppercase tracking-[0.3em]">
              What Investors Say
            </span>
            <div className="mt-3 w-12 border-primary border-t" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
               {
                 quote:
                   "I used to spend entire Sundays catching up on investment podcasts. Now I get sharper insights in five minutes over morning coffee.",
                 who: "Sarah K.",
                 title: "Portfolio Manager",
               },
              {
                quote:
                  "Caught a pick 36 hours before it trended on social media. That single edge paid for a year of Gemhog in one trade.",
                who: "Marcus C.",
                title: "Retail Investor",
              },
            ].map((t) => (
              <div
                key={t.who}
                className="border border-border border-t-2 border-t-primary bg-card p-8 md:p-10"
              >
                <p className="mb-8 text-base text-muted-foreground italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-baseline gap-2 border-border border-t pt-4">
                  <span className="font-heading font-semibold text-[11px] text-foreground uppercase tracking-wide">
                    {t.who}
                  </span>
                  <span className="text-[#555] text-[11px] italic">
                    - {t.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12">
        <div className="mx-auto max-w-3xl border border-border bg-card p-10 md:p-16">
          <div className="mb-10 w-12 border-primary border-t" />
          <h2 className="mb-6 font-bold font-heading text-3xl text-foreground uppercase leading-tight tracking-tight md:text-5xl">
            Investment ideas, trends, and expert takes — delivered to your inbox.
          </h2>
          <p className="mb-10 max-w-md text-muted-foreground leading-relaxed">
            Join investors who replaced hours of podcast listening with minutes
            of curated, data-enriched intelligence.
          </p>
          <a
            href="#"
            className="inline-block bg-primary px-10 py-4 font-heading font-medium text-primary-foreground text-sm tracking-wide transition-colors hover:bg-white"
          >
            Get Started Free
          </a>
          <p className="mt-4 text-[#555] text-[10px] uppercase tracking-widest">
            7 days free - No credit card
          </p>
          <div className="mt-10 w-12 border-primary border-t" />
        </div>
      </section>
      */}

      {/* Footer */}
      <footer className="border-border border-t px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="font-heading font-semibold text-foreground text-xs uppercase tracking-tight">
            Gemhog<span className="text-primary">.</span> - Podcast Intelligence
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <CookieSettingsButton className="text-[11px] text-muted-foreground transition-colors hover:text-foreground" />
          </div>
          <div className="text-[#555] text-[11px] italic">
            Not financial advice. Do your own research.
          </div>
        </div>
      </footer>
    </div>
  );
}
