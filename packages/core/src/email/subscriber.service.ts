import { Context, type Effect } from "effect";
import type { SubscriberError, SubscriberNotFoundError } from "./email.errors";
import type { subscriber } from "./subscriber.sql";

export type Subscriber = typeof subscriber.$inferSelect;

export interface SubscriberService {
  readonly subscribe: (
    email: string,
  ) => Effect.Effect<{ id: string; isNew: boolean }, SubscriberError>;
  readonly verify: (
    email: string,
  ) => Effect.Effect<void, SubscriberNotFoundError | SubscriberError>;
  readonly unsubscribe: (
    email: string,
  ) => Effect.Effect<void, SubscriberNotFoundError | SubscriberError>;
  readonly findByEmail: (
    email: string,
  ) => Effect.Effect<Subscriber | null, SubscriberError>;
}

export class SubscriberServiceTag extends Context.Tag("SubscriberService")<
  SubscriberServiceTag,
  SubscriberService
>() {}
