import type { Metadata } from "next";

import { LandingPageContent } from "./landing-page-content";

export const metadata: Metadata = {
  title: "Gemhog - Investment ideas delivered to your inbox",
  description:
    "We listen to financial podcasts so you don't have to. Investment ideas, trends, and expert takes — delivered weekly.",
};

export default function LandingPage() {
  return <LandingPageContent />;
}
