import { EmailServiceConsole, EmailServiceLive } from "@gemhog/email";
import { makeTracingLive } from "@gemhog/telemetry";
import * as Effect from "effect";
import { DatabaseLive } from "../drizzle/index";
import { SubscriberRepositoryLive } from "./repository.live";
import { SubscriberServiceLive } from "./service.live";

const isLocal = process.env.LOCAL_ENV === "1";
const EmailServiceLayer = isLocal ? EmailServiceConsole : EmailServiceLive;
const SubscriberRepositoryLayer = SubscriberRepositoryLive.pipe(
  Effect.Layer.provide(DatabaseLive),
);

export const SubscriberLayers = Effect.Layer.mergeAll(
  makeTracingLive("gemhog-core"),
  SubscriberRepositoryLayer,
  SubscriberServiceLive.pipe(
    Effect.Layer.provide(SubscriberRepositoryLayer),
    Effect.Layer.provide(EmailServiceLayer),
  ),
);
