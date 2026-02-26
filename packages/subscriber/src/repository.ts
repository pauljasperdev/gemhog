import * as Effect from "effect";
import type {
  SubscriberNotFoundError,
  SubscriberRepositoryError,
} from "./errors";
import type { Subscriber } from "./sql";

interface SubscriberRepositoryShape {
  readonly createSubscriber: (
    email: string,
  ) => Effect.Effect.Effect<Subscriber, SubscriberRepositoryError, never>;
  readonly readSubscriberById: (
    subscriberId: string,
  ) => Effect.Effect.Effect<
    Subscriber,
    SubscriberRepositoryError | SubscriberNotFoundError,
    never
  >;
  readonly readSubscriberByEmail: (
    email: string,
  ) => Effect.Effect.Effect<
    Subscriber,
    SubscriberRepositoryError | SubscriberNotFoundError,
    never
  >;
  readonly updateSubscriberById: (
    subscriberId: string,
    updates: Partial<Subscriber>,
  ) => Effect.Effect.Effect<
    Subscriber,
    SubscriberRepositoryError | SubscriberNotFoundError,
    never
  >;
}

export class SubscriberRepository extends Effect.Context.Tag(
  "@gemhog/core/subscriber/SubscriberRepository",
)<SubscriberRepository, SubscriberRepositoryShape>() {}
