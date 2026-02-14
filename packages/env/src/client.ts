import * as Effect from "effect";
import { localClientEnv } from "./local-dev";

export const ClientConfig = Effect.Config.all({
  NEXT_PUBLIC_SERVER_URL: Effect.Config.nonEmptyString(
    "NEXT_PUBLIC_SERVER_URL",
  ),
  NEXT_PUBLIC_SENTRY_DSN: Effect.Config.nonEmptyString(
    "NEXT_PUBLIC_SENTRY_DSN",
  ),
  NEXT_PUBLIC_POSTHOG_KEY: Effect.Config.nonEmptyString(
    "NEXT_PUBLIC_POSTHOG_KEY",
  ),
  NEXT_PUBLIC_POSTHOG_HOST: Effect.Config.nonEmptyString(
    "NEXT_PUBLIC_POSTHOG_HOST",
  ),
});

export type ClientEnv = Effect.Config.Config.Success<typeof ClientConfig>;

const provider = Effect.ConfigProvider.fromEnv();

export const ClientEnvEffect =
  Effect.Effect.withConfigProvider(provider)(ClientConfig);

function hydrateLocalEnv() {
  if (process.env.LOCAL_ENV !== "1") {
    return;
  }

  for (const [key, value] of Object.entries(localClientEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadClientEnv(): ClientEnv {
  hydrateLocalEnv();
  return Effect.Effect.runSync(ClientEnvEffect);
}
