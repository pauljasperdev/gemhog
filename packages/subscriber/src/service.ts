import * as Effect from "effect";
import type { SubscriberNotFoundError, SubscriberServiceError } from "./errors";
import type { Subscriber } from "./sql";

interface SubscriberServiceShape {
  readonly subscribe: (
    email: string,
  ) => Effect.Effect.Effect<Subscriber, SubscriberServiceError, never>;
  readonly verify: (
    subscriberId: string,
  ) => Effect.Effect.Effect<
    void,
    SubscriberServiceError | SubscriberNotFoundError,
    never
  >;
  readonly unsubscribe: (
    subscriberId: string,
  ) => Effect.Effect.Effect<
    void,
    SubscriberServiceError | SubscriberNotFoundError,
    never
  >;
}

export class SubscriberService extends Effect.Context.Tag(
  "@gemhog/subscriber/SubscriberService",
)<SubscriberService, SubscriberServiceShape>() {}
