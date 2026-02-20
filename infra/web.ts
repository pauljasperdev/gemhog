import { DATABASE_URL_POOLER } from "./neon";
import { domain } from "./router";
import { secrets } from "./secrets";

const webDomain = {
  name: domain,
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
};

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/web",
  domain: webDomain,
  dev: {
    command: "pnpm run sst:dev",
  },
  environment: {
    NEXT_PUBLIC_SERVER_URL: $dev
      ? "http://localhost:3001"
      : `https://${domain}`,
    DATABASE_URL_POOLER,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: $dev ? "http://localhost:3001" : `https://${domain}`,
    APP_URL: $dev ? "http://localhost:3001" : `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
    RESEND_API_KEY: secrets.ResendApiKey.value,
    NEXT_PUBLIC_POSTHOG_KEY: secrets.PosthogKey.value,
    NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
    NEXT_PUBLIC_SENTRY_DSN: secrets.SentryDsn.value,
    SENTRY_DSN: secrets.SentryDsn.value,
    SENTRY_AUTH_TOKEN: secrets.SentryAuthToken.value,
    SENTRY_ORG: secrets.SentryOrg.value,
    SENTRY_PROJECT: secrets.SentryProject.value,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
  },
});

export const outputs = {
  webUrl: web.url,
};
