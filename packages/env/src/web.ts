import { Config, Effect } from "effect";

const WebConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.string("NEXT_PUBLIC_SERVER_URL"),
});

// Validates at import time - fails fast if env missing
export const env = Effect.runSync(WebConfig);

// Type helper for consumers
export type WebEnv = typeof env;
