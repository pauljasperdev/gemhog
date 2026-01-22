import { domain, domainApi, isPermanentStage, router } from "./router";
import { secrets } from "./secrets";

const cors = {
  allowOrigins: [`https://${domain}`, "http://localhost:3001"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  allowCredentials: true,
};

export const api = new sst.aws.Function("Api", {
  handler: "apps/server/src/lambda.handler",
  streaming: !$dev,
  url:
    isPermanentStage && router
      ? { router: { instance: router, domain: domainApi }, cors }
      : { cors },
  environment: {
    DATABASE_URL: secrets.DatabaseUrl.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: `https://${domainApi}`,
    CORS_ORIGIN: `https://${domain}`,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
    NODE_ENV: "production",
  },
});

export const outputs = {
  apiUrl: api.url,
};
