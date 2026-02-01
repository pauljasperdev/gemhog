import { Config, ConfigProvider, Effect } from "effect";
import { localClientEnv } from "./local-dev";

const ClientConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.nonEmptyString("NEXT_PUBLIC_SERVER_URL"),
  NEXT_PUBLIC_SENTRY_DSN: Config.nonEmptyString("NEXT_PUBLIC_SENTRY_DSN"),
  NEXT_PUBLIC_POSTHOG_KEY: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_KEY"),
  NEXT_PUBLIC_POSTHOG_HOST: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_HOST"),
});

export type ClientEnv = Config.Config.Success<typeof ClientConfig>;

const isLocal = process.env.LOCAL_ENV === "1";

const provider = isLocal
  ? ConfigProvider.fromJson(localClientEnv)
  : ConfigProvider.fromJson({
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });

export const ClientEnvEffect =
  Effect.withConfigProvider(provider)(ClientConfig);

export const clientEnv: ClientEnv = Effect.runSync(ClientEnvEffect);
