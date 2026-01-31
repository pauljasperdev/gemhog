import { DatabaseLive } from "@gemhog/core/drizzle";
import { makeEmailLayers } from "@gemhog/core/email";
import { serverEnv } from "@gemhog/env/server";

export const EmailLayers = makeEmailLayers(
  serverEnv.RESEND_API_KEY,
  "Gemhog <hello@gemhog.com>",
  DatabaseLive,
);
