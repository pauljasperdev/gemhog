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
  environment: {
    NEXT_PUBLIC_SERVER_URL: $dev
      ? "http://localhost:3001"
      : `https://${domain}`,
    DATABASE_URL: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrl.value,
    DATABASE_URL_POOLER: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrlPooler.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: $dev ? "http://localhost:3001" : `https://${domain}`,
    APP_URL: $dev ? "http://localhost:3001" : `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
    // Email infrastructure
    SES_FROM_EMAIL: $dev ? "" : "hello@gemhog.com",
    SUBSCRIBER_TOKEN_SECRET: secrets.SubscriberTokenSecret.value,
    // Sentry error monitoring
    NEXT_PUBLIC_SENTRY_DSN: secrets.SentryDsn.value,
    SENTRY_DSN: secrets.SentryDsn.value,
    SENTRY_AUTH_TOKEN: secrets.SentryAuthToken.value,
    SENTRY_ORG: secrets.SentryOrg.value,
    SENTRY_PROJECT: secrets.SentryProject.value,
  },
});

export const outputs = {
  webUrl: web.url,
};
