import * as Effect from "effect";
import { localRuntimeEnv } from "./local-dev";

const RuntimeConfig = Effect.Config.all({
  DATABASE_URL: Effect.Config.nonEmptyString("DATABASE_URL"),
});

export type RuntimeEnv = Effect.Config.Config.Success<typeof RuntimeConfig>;

const isLocal = process.env.LOCAL_ENV === "1";

const provider = isLocal
  ? Effect.ConfigProvider.fromJson(localRuntimeEnv)
  : Effect.ConfigProvider.fromEnv();

export const RuntimeEnvEffect =
  Effect.Effect.withConfigProvider(provider)(RuntimeConfig);

export const runtimeEnv: RuntimeEnv = Effect.Effect.runSync(RuntimeEnvEffect);
