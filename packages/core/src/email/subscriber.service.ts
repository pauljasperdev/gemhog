import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { SubscriberError, SubscriberNotFoundError } from "./email.errors";
import { subscriber } from "./subscriber.sql";

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

export const SubscriberServiceLive = Layer.effect(
  SubscriberServiceTag,
  Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const findByEmailQuery = (
      email: string,
    ): Effect.Effect<Subscriber | null, SubscriberError> =>
      db
        .select()
        .from(subscriber)
        .where(eq(subscriber.email, email))
        .pipe(
          Effect.map((rows: Subscriber[]) => rows[0] ?? null),
          Effect.catchAll((error) =>
            Effect.fail(
              new SubscriberError({
                message: `Failed to find subscriber: ${email}`,
                cause: error,
              }),
            ),
          ),
        );

    return {
      subscribe: (email) =>
        Effect.gen(function* () {
          const existing = yield* findByEmailQuery(email);

          if (existing) {
            if (existing.status === "unsubscribed") {
              yield* db
                .update(subscriber)
                .set({
                  status: "pending",
                  subscribedAt: new Date(),
                  unsubscribedAt: null,
                })
                .where(eq(subscriber.email, email))
                .pipe(
                  Effect.catchAll((error) =>
                    Effect.fail(
                      new SubscriberError({
                        message: `Failed to re-subscribe: ${email}`,
                        cause: error,
                      }),
                    ),
                  ),
                );
              return { id: existing.id, isNew: true };
            }
            return { id: existing.id, isNew: false };
          }

          const rows: { id: string }[] = yield* db
            .insert(subscriber)
            .values({ email })
            .returning({ id: subscriber.id })
            .pipe(
              Effect.catchAll((error) =>
                Effect.fail(
                  new SubscriberError({
                    message: `Failed to create subscriber: ${email}`,
                    cause: error,
                  }),
                ),
              ),
            );

          const inserted = rows[0];
          if (!inserted) {
            return yield* Effect.fail(
              new SubscriberError({
                message: `Insert returned no rows for: ${email}`,
              }),
            );
          }
          return { id: inserted.id, isNew: true };
        }),

      verify: (email) =>
        Effect.gen(function* () {
          const existing = yield* findByEmailQuery(email);

          if (!existing) {
            return yield* Effect.fail(new SubscriberNotFoundError({ email }));
          }

          yield* db
            .update(subscriber)
            .set({
              status: "active",
              verifiedAt: new Date(),
            })
            .where(eq(subscriber.email, email))
            .pipe(
              Effect.catchAll((error) =>
                Effect.fail(
                  new SubscriberError({
                    message: `Failed to verify subscriber: ${email}`,
                    cause: error,
                  }),
                ),
              ),
            );
        }),

      unsubscribe: (email) =>
        Effect.gen(function* () {
          const existing = yield* findByEmailQuery(email);

          if (!existing) {
            return yield* Effect.fail(new SubscriberNotFoundError({ email }));
          }

          yield* db
            .update(subscriber)
            .set({
              status: "unsubscribed",
              unsubscribedAt: new Date(),
            })
            .where(eq(subscriber.email, email))
            .pipe(
              Effect.catchAll((error) =>
                Effect.fail(
                  new SubscriberError({
                    message: `Failed to unsubscribe: ${email}`,
                    cause: error,
                  }),
                ),
              ),
            );
        }),

      findByEmail: findByEmailQuery,
    };
  }),
);
