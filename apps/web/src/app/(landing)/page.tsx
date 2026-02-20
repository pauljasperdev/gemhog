import type { Metadata } from "next";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "Gemhog — We listen to financial podcasts so you don't have to",
  description:
    "Expert stock picks and investment theses from 200+ podcasts. Delivered in 5 minutes.",
};

export default function Page() {
  return <LandingPage />;
}
