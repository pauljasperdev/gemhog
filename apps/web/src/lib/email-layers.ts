import { DatabaseLive } from "@gemhog/core/drizzle";
import { makeEmailLayers } from "@gemhog/core/email";
import { env } from "@gemhog/env";

export const EmailLayers = makeEmailLayers(
  env.server.RESEND_API_KEY,
  "Gemhog <hello@gemhog.com>",
  DatabaseLive,
);
