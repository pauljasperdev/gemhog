import { Config, ConfigProvider, Effect } from "effect";
import { localDevWebEnv } from "./local-dev";

const ClientConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.nonEmptyString("NEXT_PUBLIC_SERVER_URL"),
  NEXT_PUBLIC_SENTRY_DSN: Config.nonEmptyString("NEXT_PUBLIC_SENTRY_DSN"),
  NEXT_PUBLIC_POSTHOG_KEY: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_KEY"),
  NEXT_PUBLIC_POSTHOG_HOST: Config.nonEmptyString("NEXT_PUBLIC_POSTHOG_HOST"),
});

export type ClientEnv = Config.Config.Success<typeof ClientConfig>;

// LOCAL_ENV=1 is in the Node.js process (pnpm dev command).
// In browser: process.env.LOCAL_ENV is undefined → isLocal=false → reads inlined values.
const isLocal = process.env.LOCAL_ENV === "1";

const provider = isLocal
  ? ConfigProvider.fromJson(localDevWebEnv)
  : ConfigProvider.fromJson({
      // Literal refs required — Next.js only inlines static dot-notation
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    });

// Effect — for DI consumers that want to compose with other Effects
export const ClientEnvEffect =
  Effect.withConfigProvider(provider)(ClientConfig);

// Resolved plain object — for non-Effect consumers (next.config.ts, React components)
export const clientEnv: ClientEnv = Effect.runSync(ClientEnvEffect);
