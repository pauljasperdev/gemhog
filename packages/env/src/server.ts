import { localServerEnv } from "./local-dev";

const isLocal = process.env.LOCAL_ENV === "1";

// Populate process.env with local defaults so Effect.Config.string() works anywhere
if (isLocal) {
  for (const [key, value] of Object.entries(localServerEnv)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
