import { Config, ConfigProvider, Effect } from "effect";
import { localClientEnv } from "./local-dev";

export const ClientConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.nonEmptyString("NEXT_PUBLIC_SERVER_URL"),
  NEXT_PUBLIC_SENTRY_DSN: Config.nonEmptyString("NEXT_PUBLIC_SENTRY_DSN"),
  NEXT_PUBLIC_POSTHOG_KEY: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_KEY"),
  NEXT_PUBLIC_POSTHOG_HOST: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_HOST"),
});

export type ClientEnv = Config.Config.Success<typeof ClientConfig>;

const provider = ConfigProvider.fromEnv();

export const ClientEnvEffect =
  Effect.withConfigProvider(provider)(ClientConfig);

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
  return Effect.runSync(ClientEnvEffect);
}
