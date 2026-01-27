import { DatabaseLive } from "@gemhog/core/drizzle";
import { EmailServiceConsole, SubscriberServiceLive } from "@gemhog/core/email";
import { Layer } from "effect";

export const EmailLayers = Layer.mergeAll(
  EmailServiceConsole,
  SubscriberServiceLive.pipe(Layer.provide(DatabaseLive)),
);
