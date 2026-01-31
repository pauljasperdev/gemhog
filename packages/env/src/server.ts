import { Context, Effect, Layer, Schema } from "effect";
import { localDevServerEnv } from "./local-dev";

const ServerSchema = Schema.Struct({
  DATABASE_URL: Schema.NonEmptyString,
  DATABASE_URL_POOLER: Schema.NonEmptyString,
  BETTER_AUTH_SECRET: Schema.NonEmptyString,
  BETTER_AUTH_URL: Schema.NonEmptyString,
  APP_URL: Schema.NonEmptyString,
  GOOGLE_GENERATIVE_AI_API_KEY: Schema.NonEmptyString,
  RESEND_API_KEY: Schema.NonEmptyString,
  SENTRY_DSN: Schema.NonEmptyString,
});

type ServerEnv = Schema.Schema.Type<typeof ServerSchema>;

export class ServerEnvTag extends Context.Tag("ServerEnv")<
  ServerEnvTag,
  ServerEnv
>() {}

const ServerEnvLive = Layer.effect(
  ServerEnvTag,
  Effect.sync(() => Schema.decodeUnknownSync(ServerSchema)(process.env)),
);

const ServerEnvLocalDev = Layer.succeed(
  ServerEnvTag,
  Schema.decodeUnknownSync(ServerSchema)(localDevServerEnv),
);

const isLocal = process.env.LOCAL_ENV === "1";

export const ServerEnvLayer = isLocal ? ServerEnvLocalDev : ServerEnvLive;

export const serverEnv: ServerEnv = Effect.runSync(
  Effect.provide(ServerEnvTag, ServerEnvLayer),
);
