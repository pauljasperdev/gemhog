import { EmailServiceConsole, EmailServiceLive } from "@gemhog/email";
import { TracingLive } from "@gemhog/telemetry";
import { Layer } from "effect";
import { DatabaseLive } from "../drizzle/index";
import { SubscriberServiceLive } from "./subscriber.service";

const isLocal = process.env.LOCAL_ENV === "1";
const EmailServiceLayer = isLocal ? EmailServiceConsole : EmailServiceLive;

// const EmailServiceLayer = EmailServiceLive;

export const SubscriberLayers = Layer.mergeAll(
  TracingLive,
  EmailServiceLayer,
  SubscriberServiceLive.pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(EmailServiceLayer),
  ),
);
