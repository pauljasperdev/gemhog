import "dotenv/config";
import { Config, Effect } from "effect";

const ServerConfig = Config.all({
  DATABASE_URL: Config.redacted("DATABASE_URL"),
  BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL"),
  CORS_ORIGIN: Config.string("CORS_ORIGIN"),
  NODE_ENV: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
});

// Validates at import time - fails fast if env missing
export const env = Effect.runSync(ServerConfig);

// Type helper for consumers that need the raw string
export type ServerEnv = typeof env;
