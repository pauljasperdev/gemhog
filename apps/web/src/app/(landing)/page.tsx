import type { Metadata } from "next";

import { LandingFooter } from "@/components/landing-footer";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = {
  title: "Gemhog - Investment ideas delivered to your inbox",
  description:
    "We listen to financial podcasts so you don't have to. Investment ideas, trends, and expert takes — delivered weekly.",
};

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 text-white selection:bg-emerald-500/30">
      {/* Background Glow Effect */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-emerald-500/20 opacity-20 blur-[100px]" />

      <main className="relative z-10 w-full max-w-2xl text-center">
        {/* Badge / Pill */}
        <div className="mb-8 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm">
          <span className="mr-2 flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Waitlist open
        </div>

        <h1 className="font-medium font-sans text-5xl text-white tracking-tight sm:text-7xl">
          We listen to <br />
          <span className="text-zinc-400">financial podcasts</span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-400 leading-relaxed sm:text-xl">
          Investment ideas, trends, and expert takes — so you don&apos;t have
          to. Delivered straight to your inbox.
        </p>

        <div className="mt-10">
          <SignupForm />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
