import { withSentryConfig } from "@sentry/nextjs";
import "@gemhog/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["shiki"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tunnel route to avoid ad blockers
  tunnelRoute: "/monitoring",

  // Silent unless in CI
  silent: !process.env.CI,

  // Delete source maps after upload for security
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
