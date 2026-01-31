"use client";

import { env } from "@gemhog/env";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

export function CookieConsentBanner() {
  const posthog = usePostHog();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!posthog || !env.client.NEXT_PUBLIC_POSTHOG_KEY) return;
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
      className="fixed bottom-4 left-4 z-50 w-full max-w-sm animate-[fade-in-up_0.3s_ease-out] rounded-lg border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      role="dialog"
      aria-label="Cookie consent"
    >
      <h3 className="font-semibold text-gray-900 text-sm dark:text-gray-100">
        Would you like a cookie?
      </h3>
      <p className="mt-1.5 text-gray-600 text-xs leading-relaxed dark:text-gray-400">
        We use cookies to understand how you use our site and improve your
        experience. No personal data is sold or shared.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          className="flex-1 rounded-md bg-gray-900 px-3 py-2 font-medium text-white text-xs transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700 text-xs transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Decline
        </button>
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
    <button type="button" onClick={handleClick} className={className}>
      {children ?? "Cookie Settings"}
    </button>
  );
}
