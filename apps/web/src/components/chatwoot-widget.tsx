"use client";

import { clientEnv } from "@gemhog/env/client-runtime";
import Script from "next/script";

declare global {
  interface Window {
    chatwootSDK: {
      run(config: { websiteToken: string; baseUrl: string }): void;
    };
    $chatwoot?: { setUser(id: string, attrs?: Record<string, unknown>): void };
  }
}

interface ChatwootWidgetProps {
  user: { email: string | null; name: string | null };
  identityHash?: string;
}

export function ChatwootWidget({ user, identityHash }: ChatwootWidgetProps) {
  const baseUrl = clientEnv.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  const websiteToken = clientEnv.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;

  if (!websiteToken || !baseUrl) return null;

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return (
    <Script
      src={`${normalizedBaseUrl}/packs/js/sdk.js`}
      strategy="afterInteractive"
      onLoad={() => {
        const email = user.email;
        if (email) {
          window.addEventListener(
            "chatwoot:ready",
            () => {
              window.$chatwoot?.setUser(email, {
                email,
                ...(user.name ? { name: user.name } : {}),
                ...(identityHash ? { identifier_hash: identityHash } : {}),
              });
            },
            { once: true },
          );
        }
        window.chatwootSDK.run({ websiteToken, baseUrl: normalizedBaseUrl });
      }}
    />
  );
}
