import { neon } from "./neon";
import { secrets } from "./secrets";

// Router for CloudFront domain routing
// Skip domain for personal stages (use Function URL directly)
const domainConfig = ["dev", "test", "prod"].includes($app.stage)
  ? {
      domain: {
        name:
          $app.stage === "prod"
            ? "api.gemhog.com"
            : `api.${$app.stage}.gemhog.com`,
        dns: sst.cloudflare.dns({
          // CLOUDFLARE_ZONE_ID required for domain configuration
          zone: process.env.CLOUDFLARE_ZONE_ID ?? "",
        }),
      },
    }
  : {};

export const router = new sst.aws.Router("ApiRouter", domainConfig);

// Hono Lambda with conditional streaming
// streaming: false in $dev because sst dev doesn't support it
export const api = new sst.aws.Function("Api", {
  handler: "apps/server/src/lambda.handler",
  runtime: "nodejs22.x",
  streaming: !$dev,
  timeout: "15 minutes", // For long AI conversations
  memory: "512 MB",
  url: {
    router: ["dev", "test", "prod"].includes($app.stage)
      ? { instance: router }
      : true, // Personal stages use direct Function URL
    cors: {
      allowOrigins: [
        "https://gemhog.com",
        "https://*.gemhog.com",
        "http://localhost:3001", // Local Next.js dev
      ],
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowCredentials: true,
    },
  },
  link: [neon, secrets.BetterAuthSecret, secrets.GoogleApiKey],
  environment: {
    NODE_ENV: "production",
    // DATABASE_URL comes from linked Neon (pooled for Lambda)
    DATABASE_URL: neon.properties.urlPooler,
    // Stage-conditional URLs
    CORS_ORIGIN:
      $app.stage === "prod"
        ? "https://gemhog.com"
        : $app.stage === "dev" || $app.stage === "test"
          ? `https://${$app.stage}.gemhog.com`
          : "http://localhost:3001",
    // BETTER_AUTH_URL set via transform for personal stages (needs api.url)
    BETTER_AUTH_URL:
      $app.stage === "prod"
        ? "https://api.gemhog.com"
        : $app.stage === "dev" || $app.stage === "test"
          ? `https://api.${$app.stage}.gemhog.com`
          : "", // Set via transform below
    // Linked secrets become env vars automatically
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    GOOGLE_GENERATIVE_AI_API_KEY: secrets.GoogleApiKey.value,
  },
  // Transform to set BETTER_AUTH_URL for personal stages (self-reference)
  transform: {
    function: (args) => {
      if (!["dev", "test", "prod"].includes($app.stage)) {
        args.environment = $resolve([args.environment, api.url]).apply(
          ([env, url]) => ({
            ...env,
            BETTER_AUTH_URL: url,
          }),
        );
      }
    },
  },
});

export const outputs = {
  apiUrl: api.url,
};
