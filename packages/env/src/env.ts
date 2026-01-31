import { Config, ConfigProvider, Effect, Schema } from "effect";
import { localDevServerEnv, localDevWebEnv } from "./local-dev";

const isLocal = process.env.LOCAL_ENV === "1";

// -- Server env (Effect Config, lazy) --

const serverProvider = isLocal
  ? ConfigProvider.fromEnv().pipe(
      ConfigProvider.orElse(() =>
        ConfigProvider.fromMap(new Map(Object.entries(localDevServerEnv))),
      ),
    )
  : ConfigProvider.fromEnv();

function resolveServer() {
  return Effect.runSync(
    Effect.withConfigProvider(
      Config.all({
        DATABASE_URL: Config.nonEmptyString("DATABASE_URL"),
        DATABASE_URL_POOLER: Config.nonEmptyString("DATABASE_URL_POOLER"),
        BETTER_AUTH_SECRET: Config.string("BETTER_AUTH_SECRET").pipe(
          Config.validate({
            message: "Expected at least 32 characters",
            validation: (s) => s.length >= 32,
          }),
        ),
        BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL").pipe(
          Config.validate({
            message: "Expected a valid URL",
            validation: (s) => {
              try {
                new URL(s);
                return true;
              } catch {
                return false;
              }
            },
          }),
        ),
        APP_URL: Config.string("APP_URL").pipe(
          Config.validate({
            message: "Expected a valid URL",
            validation: (s) => {
              try {
                new URL(s);
                return true;
              } catch {
                return false;
              }
            },
          }),
        ),
        GOOGLE_GENERATIVE_AI_API_KEY: Config.nonEmptyString(
          "GOOGLE_GENERATIVE_AI_API_KEY",
        ),
        RESEND_API_KEY: Config.nonEmptyString("RESEND_API_KEY").pipe(
          Config.validate({
            message: 'Expected to start with "re_"',
            validation: (s) => s.startsWith("re_"),
          }),
        ),
        SENTRY_DSN: Config.nonEmptyString("SENTRY_DSN"),
      }),
      serverProvider,
    ),
  );
}

// -- Client env (Effect Schema, static process.env refs for Next.js) --

function resolveClient() {
  const f = (v: string | undefined, k: keyof typeof localDevWebEnv) =>
    (v || undefined) ?? (isLocal ? localDevWebEnv[k] : undefined);

  return Schema.decodeUnknownSync(
    Schema.Struct({
      NEXT_PUBLIC_SERVER_URL: Schema.NonEmptyString,
      NEXT_PUBLIC_SENTRY_DSN: Schema.NonEmptyString,
      NEXT_PUBLIC_POSTHOG_KEY: Schema.NonEmptyString,
      NEXT_PUBLIC_POSTHOG_HOST: Schema.NonEmptyString,
    }),
  )({
    NEXT_PUBLIC_SERVER_URL: f(
      process.env.NEXT_PUBLIC_SERVER_URL,
      "NEXT_PUBLIC_SERVER_URL",
    ),
    NEXT_PUBLIC_SENTRY_DSN: f(
      process.env.NEXT_PUBLIC_SENTRY_DSN,
      "NEXT_PUBLIC_SENTRY_DSN",
    ),
    NEXT_PUBLIC_POSTHOG_KEY: f(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      "NEXT_PUBLIC_POSTHOG_KEY",
    ),
    NEXT_PUBLIC_POSTHOG_HOST: f(
      process.env.NEXT_PUBLIC_POSTHOG_HOST,
      "NEXT_PUBLIC_POSTHOG_HOST",
    ),
  });
}

// -- Exported env (lazy getters) --

let _server: ReturnType<typeof resolveServer> | undefined;
let _client: ReturnType<typeof resolveClient> | undefined;

export const env = {
  get server() {
    if ("window" in globalThis)
      throw new Error("env.server is not available on the client");
    if (!_server) _server = resolveServer();
    return _server;
  },
  get client() {
    if (!_client) _client = resolveClient();
    return _client;
  },
};
