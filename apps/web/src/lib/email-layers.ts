import { DatabaseLive } from "@gemhog/core/drizzle";
import {
  EmailServiceConsole,
  makeEmailServiceLive,
  SubscriberServiceLive,
} from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Layer } from "effect";

export const EmailLayers = Layer.mergeAll(
  env.RESEND_API_KEY
    ? makeEmailServiceLive(env.RESEND_API_KEY, "Gemhog <hello@gemhog.com>")
    : EmailServiceConsole,
  SubscriberServiceLive.pipe(Layer.provide(DatabaseLive)),
);
