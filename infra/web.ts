import { api } from "./api";
import { neon } from "./neon";
import { secrets } from "./secrets";

// Skip domain for personal stages
const domainConfig = ["dev", "test", "prod"].includes($app.stage)
  ? {
      domain: {
        name: $app.stage === "prod" ? "gemhog.com" : `${$app.stage}.gemhog.com`,
        dns: sst.cloudflare.dns({
          // CLOUDFLARE_ZONE_ID required for domain configuration
          zone: process.env.CLOUDFLARE_ZONE_ID ?? "",
        }),
      },
    }
  : {};

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/web",
  ...domainConfig,
  link: [neon, secrets.BetterAuthSecret],
  environment: {
    // Public env var for client-side API calls
    NEXT_PUBLIC_SERVER_URL:
      $app.stage === "prod"
        ? "https://api.gemhog.com"
        : $app.stage === "dev" || $app.stage === "test"
          ? `https://api.${$app.stage}.gemhog.com`
          : api.url,
    // Server-side env vars
    DATABASE_URL: neon.properties.urlPooler,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL:
      $app.stage === "prod"
        ? "https://api.gemhog.com"
        : $app.stage === "dev" || $app.stage === "test"
          ? `https://api.${$app.stage}.gemhog.com`
          : api.url,
    CORS_ORIGIN:
      $app.stage === "prod"
        ? "https://gemhog.com"
        : $app.stage === "dev" || $app.stage === "test"
          ? `https://${$app.stage}.gemhog.com`
          : "http://localhost:3001",
  },
});

export const outputs = {
  webUrl: web.url,
};
