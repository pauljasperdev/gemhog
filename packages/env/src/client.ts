import { Config, ConfigProvider, Effect } from "effect";
import { localClientEnv } from "./local-dev";

const isLocal = process.env.LOCAL_ENV === "1";

// Populate process.env with local defaults so Config.string() works anywhere
if (isLocal) {
  for (const [key, value] of Object.entries(localClientEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const ClientConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.nonEmptyString("NEXT_PUBLIC_SERVER_URL"),
  NEXT_PUBLIC_SENTRY_DSN: Config.nonEmptyString("NEXT_PUBLIC_SENTRY_DSN"),
  NEXT_PUBLIC_POSTHOG_KEY: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_KEY"),
  NEXT_PUBLIC_POSTHOG_HOST: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_HOST"),
});

export type ClientEnv = Config.Config.Success<typeof ClientConfig>;

const provider = ConfigProvider.fromEnv();

export const ClientEnvEffect =
  Effect.withConfigProvider(provider)(ClientConfig);

export const clientEnv: ClientEnv = Effect.runSync(ClientEnvEffect);
