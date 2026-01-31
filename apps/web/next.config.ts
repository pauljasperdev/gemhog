import { withSentryConfig } from "@sentry/nextjs";
import "@gemhog/env/server";
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
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  tunnelRoute: "/monitoring",

  silent: !process.env.CI,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
