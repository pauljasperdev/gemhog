import { Layer } from "effect";
import { DatabaseLive } from "../drizzle/index";
import { TracingLive } from "../telemetry";
import { EmailServiceConsole, EmailServiceLive } from "./email.service";
import { SubscriberServiceLive } from "./subscriber.service";

const isLocal = process.env.LOCAL_ENV === "1";
const EmailServiceLayer = isLocal ? EmailServiceConsole : EmailServiceLive;

// const EmailServiceLayer = EmailServiceLive;

export const EmailLayers = Layer.mergeAll(
  TracingLive,
  EmailServiceLayer,
  SubscriberServiceLive.pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(EmailServiceLayer),
  ),
);
