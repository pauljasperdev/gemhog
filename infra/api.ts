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
    DATABASE_URL: secrets.DatabaseUrl.value,
    DATABASE_URL_POOLER: secrets.DatabaseUrlPooler.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: `https://${domainApi}`,
    CORS_ORIGIN: $dev ? "http://localhost:3001" : `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
  },
});

export const outputs = {
  apiUrl: api.url,
};
