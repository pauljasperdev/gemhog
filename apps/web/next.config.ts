import { withSentryConfig } from "@sentry/nextjs";
import "@gemhog/env/web";
import { isCi } from "@gemhog/env/runtime";
import { env as sentryEnv } from "@gemhog/env/sentry";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["@gemhog/api", "@gemhog/core", "@gemhog/env", "shiki"],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ph/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ph/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: sentryEnv.SENTRY_ORG,
  project: sentryEnv.SENTRY_PROJECT,
  authToken: sentryEnv.SENTRY_AUTH_TOKEN,

  tunnelRoute: "/monitoring",

  silent: !isCi,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
