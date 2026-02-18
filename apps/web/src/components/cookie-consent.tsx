"use client";

import { clientEnv } from "@gemhog/env/client-runtime";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsentBanner() {
  const posthog = usePostHog();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!posthog?.__loaded || !clientEnv.NEXT_PUBLIC_POSTHOG_KEY) return;
    const status = posthog.get_explicit_consent_status();
    if (status === "pending") {
      setVisible(true);
    }
  }, [posthog]);

  useEffect(() => {
    function handleShowConsent() {
      setVisible(true);
    }
    window.addEventListener("show-cookie-consent", handleShowConsent);
    return () => {
      window.removeEventListener("show-cookie-consent", handleShowConsent);
    };
  }, []);

  function handleAccept() {
    posthog?.opt_in_capturing();
    setVisible(false);
  }

  function handleDecline() {
    posthog?.opt_out_capturing();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 w-full max-w-sm animate-[fade-in-up_0.3s_ease-out] border border-border bg-card p-5 shadow-lg"
      role="dialog"
      aria-label="Cookie consent"
    >
      <h3 className="font-heading font-semibold text-foreground text-sm">
        Would you like a cookie?
      </h3>
      <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
        We use cookies to understand how you use our site and improve your
        experience. No personal data is sold or shared.
      </p>
      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAccept}
          className="flex-1"
        >
          Accept
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDecline}
          className="flex-1"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

export function CookieSettingsButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("show-cookie-consent"));
  }

  return (
    <Button variant="link" onClick={handleClick} className={className}>
      {children ?? "Cookie Settings"}
    </Button>
  );
}
