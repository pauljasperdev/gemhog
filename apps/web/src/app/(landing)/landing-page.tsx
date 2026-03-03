"use client";

import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { Section } from "@/components/section";
import { SubscribeForm } from "@/components/subscribe-form";

const problems = [
  {
    title: "No Time for Podcasts",
    desc: "You know there's gold in those 2-hour interviews. You just don't have 2 hours.",
  },
  {
    title: "Missing Early Signals",
    desc: "The best ideas circulate before they trend. Early signal is the edge that compounds.",
  },
  {
    title: "You Can't See Every Angle",
    desc: "We're all trapped in our own perspective. We surface the expert views you'd never find on your own.",
  },
];

const benefits = [
  {
    title: "Ideas You'd Miss",
    desc: "Expert analysts discuss their highest-conviction picks on podcasts. We extract every thesis so you never miss a hidden gem.",
  },
  {
    title: "Data at Your Fingertips",
    desc: "Each idea comes with the context you need — price targets, earnings dates, analyst ratings — so you can evaluate, not hunt.",
  },
  {
    title: "Stay Ahead",
    desc: "See what experts are discussing before it trends. Early signal means time to research, not react.",
  },
  {
    title: "Research in Minutes",
    desc: "Your briefing, filtered to your interests. The investment ideas that matter, without the noise.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between border-foreground border-b-2 bg-background px-6 py-5 md:px-16">
        <div className="font-black font-heading text-xl uppercase tracking-tight">
          Gemhog<span className="text-primary">.</span>
        </div>
        <a
          href="/sign-in"
          className="border-2 border-foreground px-5 py-2 font-bold text-xs uppercase tracking-widest transition-all hover:bg-foreground hover:text-background"
        >
          Sign In
        </a>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:px-16 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-8 font-black font-heading text-5xl text-foreground uppercase leading-[1.05] tracking-tight md:text-7xl">
            We listen to{" "}
            <span className="text-primary">investment podcasts</span> so you
            don&apos;t have to
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
            Expert claims surfaced and clustered — so you can make better
            decisions. Stay on top of current trends in the stock market.
          </p>
          <div className="mx-auto max-w-md">
            <SubscribeForm />
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="border-foreground border-b-2" />

      {/* Problem Section */}
      <section className="border-foreground border-b-2 bg-secondary px-6 py-24 md:px-16">
        <div className="mx-auto max-w-7xl">
          <Section title="Sound Familiar?" variant="primary">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {problems.map((p) => (
                <div
                  key={p.title}
                  className="bg-card p-8 transition-transform hover:-translate-y-1"
                  style={{
                    border: "2px solid var(--foreground)",
                    boxShadow: "4px 4px 0 var(--primary)",
                  }}
                >
                  <h3 className="mb-4 font-black font-heading text-xl uppercase tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="features"
        className="border-foreground border-b-2 bg-background px-6 py-24 md:px-16"
      >
        <div className="mx-auto max-w-7xl">
          <Section title="What You Get">
            <div className="mx-auto max-w-2xl space-y-6">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="bg-card p-8 transition-transform hover:-translate-y-1"
                  style={{
                    border: "2px solid var(--foreground)",
                    boxShadow: "4px 4px 0 var(--primary)",
                  }}
                >
                  <h3 className="mb-3 font-black font-heading text-xl uppercase tracking-tight">
                    {b.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-secondary px-6 py-24 md:px-16">
        <div className="mx-auto max-w-3xl">
          <div
            className="bg-card p-12 text-center"
            style={{
              border: "2px solid var(--foreground)",
              boxShadow: "8px 8px 0 var(--primary)",
            }}
          >
            <div className="mb-2 font-bold font-mono text-primary text-xs uppercase tracking-[0.3em]">
              Early Access
            </div>
            <h2 className="mb-6 font-black font-heading text-4xl text-foreground uppercase leading-tight tracking-tight md:text-5xl">
              Be First to Know
            </h2>
            <p className="mb-10 text-lg text-muted-foreground leading-relaxed">
              Find the expert investment ideas you&apos;d otherwise miss.
            </p>
            <div className="mx-auto max-w-md">
              <SubscribeForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-foreground border-t-2 bg-foreground px-6 py-12 md:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3 md:items-center">
          <div>
            <div className="font-black font-heading text-background text-xl uppercase tracking-tight">
              Gemhog<span className="text-primary">.</span> - Podcast
              Intelligence
            </div>
          </div>
          <div className="flex items-center gap-6 md:justify-center">
            <Link
              href="/privacy"
              className="font-bold text-muted-foreground text-xs uppercase tracking-widest hover:text-background"
            >
              Privacy Policy
            </Link>
            <CookieSettingsButton className="font-bold text-muted-foreground text-xs uppercase tracking-widest hover:text-background" />
          </div>
          <div className="font-bold text-muted-foreground text-xs uppercase tracking-widest md:text-right">
            Not financial advice. Do your own research.
          </div>
        </div>
      </footer>
    </div>
  );
}
