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
    <div className="dark flex min-h-svh flex-col items-center justify-center bg-gray-950 px-6">
      <main className="w-full max-w-xl text-center">
        <h1 className="font-bold font-display text-4xl text-white tracking-tight sm:text-5xl">
          We listen to financial podcasts so you don&apos;t have to
        </h1>
        <p className="mt-4 text-gray-400 text-lg sm:text-xl">
          Investment ideas, trends, and expert takes — delivered to your inbox.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
