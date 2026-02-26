import { SqlLive } from "@gemhog/db";
import { EmailServiceLayer } from "@gemhog/email";
import { makeTracingLive } from "@gemhog/telemetry";
import * as Effect from "effect";
import { SubscriberRepositoryLive } from "./repository.live";
import { SubscriberServiceLive } from "./service.live";

const SubscriberRepositoryLayer = SubscriberRepositoryLive.pipe(
  Effect.Layer.provide(SqlLive),
);

const SubscriberServiceLayer = SubscriberServiceLive.pipe(
  Effect.Layer.provide(SubscriberRepositoryLayer),
  Effect.Layer.provide(EmailServiceLayer),
);

export const SubscriberLayers = Effect.Layer.mergeAll(
  makeTracingLive("gemhog-core"),
  SubscriberRepositoryLayer,
  SubscriberServiceLayer,
);
