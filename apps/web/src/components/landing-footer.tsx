"use client";

import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-consent";

export function LandingFooter() {
  return (
    <footer className="mt-auto w-full py-8 text-center text-gray-500 text-xs">
      <span>&copy; {new Date().getFullYear()} Gemhog</span>
      <span className="mx-2">&middot;</span>
      <Link href="/privacy" className="transition-colors hover:text-gray-300">
        Privacy Policy
      </Link>
      <span className="mx-2">&middot;</span>
      <CookieSettingsButton className="transition-colors hover:text-gray-300">
        Cookie Settings
      </CookieSettingsButton>
    </footer>
  );
}
