import { DatabaseLive } from "@gemhog/core/drizzle";
import { EmailServiceAuto, SubscriberServiceLive } from "@gemhog/core/email";
import { Layer } from "effect";

export const EmailLayers = Layer.mergeAll(
  EmailServiceAuto,
  SubscriberServiceLive.pipe(Layer.provide(DatabaseLive)),
);
