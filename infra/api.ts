import { domain, domainApi, router } from "./router";
import { secrets } from "./secrets";

// const cors = {
//   allowOrigins: [`https://${domain}`, "http://localhost:3001"],
//   allowMethods: ["GET", "POST", "OPTIONS"],
//   allowHeaders: ["Content-Type", "Authorization"],
//   allowCredentials: true,
// };

export const api = new sst.aws.Function("Api", {
  handler: "apps/server/src/lambda.handler",
  streaming: !$dev,
  url: {
    router: { instance: router, domain: domainApi },
  },
  environment: {
    DATABASE_URL: secrets.DatabaseUrl.value,
    DATABASE_URL_POOLER: secrets.DatabaseUrlPooler.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: `https://${domainApi}`,
    CORS_ORIGIN: `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
  },
});

export const outputs = {
  apiUrl: api.url,
};
