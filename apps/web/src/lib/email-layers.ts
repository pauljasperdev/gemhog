import { DatabaseLive } from "@gemhog/core/drizzle";
import { EmailServiceConsole, SubscriberServiceLive } from "@gemhog/core/email";
import { Layer } from "effect";

// Temporary: uses console logger until plan 02-07 adds makeEmailServiceLive factory
export const EmailLayers = Layer.mergeAll(
  EmailServiceConsole,
  SubscriberServiceLive.pipe(Layer.provide(DatabaseLive)),
);
