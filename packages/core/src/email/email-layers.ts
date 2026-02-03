import { Layer } from "effect";
import { DatabaseLive } from "../drizzle/index";
import { EmailServiceLive } from "./email.service";
import { SubscriberServiceLive } from "./subscriber.service";

export const EmailLayers = Layer.mergeAll(
  EmailServiceLive,
  SubscriberServiceLive.pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(EmailServiceLive),
  ),
);
