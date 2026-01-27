import { domain, domainApi, router } from "./router";
import { secrets } from "./secrets";

export const api = new sst.aws.Function("Api", {
  handler: "apps/server/src/lambda.handler",
  streaming: !$dev,
  url: {
    authorization: "none",
    cors: false,
    router: {
      instance: router,
      path: "/",
    },
  },
  environment: {
    DATABASE_URL: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrl.value,
    DATABASE_URL_POOLER: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrlPooler.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: `https://${domainApi}`,
    APP_URL: $dev ? "http://localhost:3001" : `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
    // Email infrastructure
    SES_FROM_EMAIL: $dev ? "" : "hello@gemhog.com",
    SUBSCRIBER_TOKEN_SECRET: secrets.SubscriberTokenSecret.value,
    // Sentry error monitoring
    SENTRY_DSN: secrets.SentryDsn.value,
  },
});

export const outputs = {
  apiUrl: api.url,
};
