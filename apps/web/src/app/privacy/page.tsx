import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Gemhog",
  description: "Gemhog privacy policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-3xl uppercase tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-4 text-muted-foreground">
        This page is under construction. A full privacy policy will be published
        before launch.
      </p>
    </div>
  );
}
