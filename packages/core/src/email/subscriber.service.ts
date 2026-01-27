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
          Effect.mapError(
            (error) =>
              new SubscriberError({
                message: `Failed to find subscriber: ${email}`,
                cause: error,
              }),
          ),
        );

    const requireByEmail = (
      email: string,
    ): Effect.Effect<Subscriber, SubscriberNotFoundError | SubscriberError> =>
      findByEmailQuery(email).pipe(
        Effect.flatMap((sub) =>
          sub
            ? Effect.succeed(sub)
            : Effect.fail(new SubscriberNotFoundError({ email })),
        ),
      );

    return {
      subscribe: (email) =>
        Effect.gen(function* () {
          const existing = yield* findByEmailQuery(email);

          if (existing && existing.status === "unsubscribed") {
            yield* db
              .update(subscriber)
              .set({
                status: "pending",
                subscribedAt: new Date(),
                unsubscribedAt: null,
              })
              .where(eq(subscriber.email, email))
              .pipe(
                Effect.mapError(
                  (error) =>
                    new SubscriberError({
                      message: `Failed to re-subscribe: ${email}`,
                      cause: error,
                    }),
                ),
              );
            return { id: existing.id, isNew: true };
          }

          if (existing) {
            return { id: existing.id, isNew: false };
          }

          const rows: { id: string }[] = yield* db
            .insert(subscriber)
            .values({ email })
            .returning({ id: subscriber.id })
            .pipe(
              Effect.mapError(
                (error) =>
                  new SubscriberError({
                    message: `Failed to create subscriber: ${email}`,
                    cause: error,
                  }),
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
        requireByEmail(email).pipe(
          Effect.flatMap(() =>
            db
              .update(subscriber)
              .set({
                status: "active",
                verifiedAt: new Date(),
              })
              .where(eq(subscriber.email, email)),
          ),
          Effect.mapError((error) =>
            error._tag === "SubscriberNotFoundError"
              ? error
              : new SubscriberError({
                  message: `Failed to verify subscriber: ${email}`,
                  cause: error,
                }),
          ),
          Effect.asVoid,
        ),

      unsubscribe: (email) =>
        requireByEmail(email).pipe(
          Effect.flatMap(() =>
            db
              .update(subscriber)
              .set({
                status: "unsubscribed",
                unsubscribedAt: new Date(),
              })
              .where(eq(subscriber.email, email)),
          ),
          Effect.mapError((error) =>
            error._tag === "SubscriberNotFoundError"
              ? error
              : new SubscriberError({
                  message: `Failed to unsubscribe: ${email}`,
                  cause: error,
                }),
          ),
          Effect.asVoid,
        ),

      findByEmail: findByEmailQuery,
    };
  }),
);
