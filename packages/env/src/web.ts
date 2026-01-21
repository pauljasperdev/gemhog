import { Config, Effect } from "effect";

const WebConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.string("NEXT_PUBLIC_SERVER_URL"),
});

// Validates at import time
export const env = Effect.runSync(WebConfig);

export type WebEnv = typeof env;
