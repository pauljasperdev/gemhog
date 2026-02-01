"use client";

import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-consent";
import { buttonVariants } from "@/components/ui/button";

export function LandingFooter() {
  return (
    <footer className="mt-auto w-full py-8 text-center text-muted-foreground text-xs">
      <span>&copy; {new Date().getFullYear()} Gemhog</span>
      <span className="mx-2">&middot;</span>
      <Link href="/privacy" className={buttonVariants({ variant: "link" })}>
        Privacy Policy
      </Link>
      <span className="mx-2">&middot;</span>
      <CookieSettingsButton>Cookie Settings</CookieSettingsButton>
    </footer>
  );
}
