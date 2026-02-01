import { Config, ConfigProvider, Effect } from "effect";
import { localRuntimeEnv } from "./local-dev";

const RuntimeConfig = Config.all({
  DATABASE_URL: Config.nonEmptyString("DATABASE_URL"),
});

export type RuntimeEnv = Config.Config.Success<typeof RuntimeConfig>;

const isLocal = process.env.LOCAL_ENV === "1";

const provider = isLocal
  ? ConfigProvider.fromJson(localRuntimeEnv)
  : ConfigProvider.fromEnv();

export const RuntimeEnvEffect =
  Effect.withConfigProvider(provider)(RuntimeConfig);

export const runtimeEnv: RuntimeEnv = Effect.runSync(RuntimeEnvEffect);
