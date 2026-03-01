import { domain, domainApi, router } from "./router";
import { secrets } from "./secrets";
import { DATABASE_URL_POOLER } from "./sql";

export const api = new sst.aws.Function("Api", {
  runtime: "nodejs22.x",
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
    DATABASE_URL_POOLER,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: `https://${domainApi}`,
    APP_URL: $dev ? "http://localhost:3001" : `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
    // Email sending (Resend)
    RESEND_API_KEY: secrets.ResendApiKey.value,
    // Sentry error monitoring
    SENTRY_DSN: secrets.SentryDsn.value,
  },
});

export const outputs = {
  apiUrl: api.url,
};
