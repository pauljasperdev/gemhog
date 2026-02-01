import { Config, ConfigProvider, Effect } from "effect";
import { localServerEnv } from "./local-dev";

const ServerConfig = Config.all({
  DATABASE_URL: Config.nonEmptyString("DATABASE_URL"),
  DATABASE_URL_POOLER: Config.nonEmptyString("DATABASE_URL_POOLER"),
  BETTER_AUTH_SECRET: Config.nonEmptyString("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: Config.nonEmptyString("BETTER_AUTH_URL"),
  APP_URL: Config.nonEmptyString("APP_URL"),
  GOOGLE_GENERATIVE_AI_API_KEY: Config.nonEmptyString(
    "GOOGLE_GENERATIVE_AI_API_KEY",
  ),
  RESEND_API_KEY: Config.nonEmptyString("RESEND_API_KEY"),
  SENTRY_DSN: Config.nonEmptyString("SENTRY_DSN"),
});

export type ServerEnv = Config.Config.Success<typeof ServerConfig>;

const isLocal = process.env.LOCAL_ENV === "1";

const provider = isLocal
  ? ConfigProvider.fromJson(localServerEnv)
  : ConfigProvider.fromEnv();

export const ServerEnvEffect =
  Effect.withConfigProvider(provider)(ServerConfig);

export const serverEnv: ServerEnv = Effect.runSync(ServerEnvEffect);
