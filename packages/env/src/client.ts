import { Context, Effect, Layer, Schema } from "effect";
import { localDevWebEnv } from "./local-dev";

const ClientSchema = Schema.Struct({
  NEXT_PUBLIC_SERVER_URL: Schema.NonEmptyString,
  NEXT_PUBLIC_SENTRY_DSN: Schema.NonEmptyString,
  NEXT_PUBLIC_POSTHOG_KEY: Schema.NonEmptyString,
  NEXT_PUBLIC_POSTHOG_HOST: Schema.NonEmptyString,
});

type ClientEnv = Schema.Schema.Type<typeof ClientSchema>;

export class ClientEnvTag extends Context.Tag("ClientEnv")<
  ClientEnvTag,
  ClientEnv
>() {}

// Literal process.env refs required for Next.js build-time inlining
const ClientEnvLive = Layer.effect(
  ClientEnvTag,
  Effect.sync(() =>
    Schema.decodeUnknownSync(ClientSchema)({
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    }),
  ),
);

const ClientEnvLocalDev = Layer.succeed(
  ClientEnvTag,
  Schema.decodeUnknownSync(ClientSchema)(localDevWebEnv),
);

const isLocal = process.env.LOCAL_ENV === "1";

export const ClientEnvLayer = isLocal ? ClientEnvLocalDev : ClientEnvLive;

export const clientEnv: ClientEnv = Effect.runSync(
  Effect.provide(ClientEnvTag, ClientEnvLayer),
);
