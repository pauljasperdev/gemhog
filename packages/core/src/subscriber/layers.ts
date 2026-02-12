import { EmailServiceConsole, EmailServiceLive } from "@gemhog/email";
import { makeTracingLive } from "@gemhog/telemetry";
import { Layer } from "effect";
import { DatabaseLive } from "../drizzle/index";
import { SubscriberServiceLive } from "./service";

const isLocal = process.env.LOCAL_ENV === "1";
const EmailServiceLayer = isLocal ? EmailServiceConsole : EmailServiceLive;

export const SubscriberLayers = Layer.mergeAll(
  makeTracingLive("gemhog-core"),
  SubscriberServiceLive.pipe(
    Layer.provide(DatabaseLive),
    Layer.provide(EmailServiceLayer),
  ),
);
