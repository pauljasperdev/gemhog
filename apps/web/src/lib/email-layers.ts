import { DatabaseLive } from "@gemhog/core/drizzle";
import {
  EmailServiceConsole,
  makeEmailServiceLive,
  SubscriberServiceLive,
} from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Layer } from "effect";

export const EmailLayers = Layer.mergeAll(
  env.SES_FROM_EMAIL
    ? makeEmailServiceLive(env.SES_FROM_EMAIL)
    : EmailServiceConsole,
  SubscriberServiceLive.pipe(Layer.provide(DatabaseLive)),
);
