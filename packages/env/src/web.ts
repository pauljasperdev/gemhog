/**
 * Client-side environment configuration for Next.js apps.
 *
 * IMPORTANT: Next.js replaces process.env.NEXT_PUBLIC_* with literal values
 * at BUILD TIME. We cannot use Effect Config here because it tries to read
 * process.env at runtime, which doesn't work in the browser.
 *
 * For client-side code, we directly reference process.env.NEXT_PUBLIC_*
 * so Next.js can inline the values during build.
 */

function getEnv() {
  const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!NEXT_PUBLIC_SERVER_URL) {
    throw new Error(
      "NEXT_PUBLIC_SERVER_URL is required. " +
        "Ensure it is set in .env or .env.local for Next.js to inline at build time.",
    );
  }

  return {
    NEXT_PUBLIC_SERVER_URL,
  } as const;
}

export const env = getEnv();

export type WebEnv = typeof env;
