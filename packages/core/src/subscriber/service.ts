import type { SqlError } from "@effect/sql/SqlError";
import type { EmailSendError } from "@gemhog/email";
import * as Effect from "effect";
import type { ConfigError } from "effect/ConfigError";
import type { SubscriberNotFoundError } from "./errors";
import type { Subscriber } from "./sql";

interface SubscriberServiceShape {
  readonly subscribe: (
    email: string,
  ) => Effect.Effect.Effect<
    Subscriber,
    EmailSendError | SqlError | ConfigError,
    never
  >;
  readonly verify: (
    subscriberId: string,
  ) => Effect.Effect.Effect<void, SqlError | SubscriberNotFoundError, never>;
  readonly unsubscribe: (
    subscriberId: string,
  ) => Effect.Effect.Effect<void, SqlError | SubscriberNotFoundError, never>;
}

export class SubscriberService extends Effect.Context.Tag(
  "@gemhog/core/subscriber/SubscriberService",
)<SubscriberService, SubscriberServiceShape>() {}
