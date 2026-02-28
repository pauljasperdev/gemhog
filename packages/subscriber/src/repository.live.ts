import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import * as Effect from "effect";
import { SubscriberNotFoundError, SubscriberRepositoryError } from "./errors";
import { SubscriberRepository } from "./repository";
import { type Subscriber, subscriber } from "./sql";

export const SubscriberRepositoryLive = Effect.Layer.effect(
  SubscriberRepository,
  Effect.Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const readSubscriberByEmail = (email: string) =>
      db
        .select()
        .from(subscriber)
        .where(eq(subscriber.email, email))
        .pipe(
          Effect.Effect.map((rows: Subscriber[]) => rows[0]),
          Effect.Effect.flatMap((row) =>
            row
              ? Effect.Effect.succeed(row)
              : Effect.Effect.fail(
                  new SubscriberNotFoundError({ identifier: `email:${email}` }),
                ),
          ),
        );

    const readSubscriberById = (subscriberId: string) =>
      db
        .select()
        .from(subscriber)
        .where(eq(subscriber.id, subscriberId))
        .pipe(
          Effect.Effect.map((rows: Subscriber[]) => rows[0]),
          Effect.Effect.flatMap((row) =>
            row
              ? Effect.Effect.succeed(row)
              : Effect.Effect.fail(
                  new SubscriberNotFoundError({
                    identifier: `subscriberId:${subscriberId}`,
                  }),
                ),
          ),
        );

    const updateSubscriberById = (
      subscriberId: string,
      updates: Partial<Subscriber>,
    ) =>
      db
        .update(subscriber)
        .set(updates)
        .where(eq(subscriber.id, subscriberId))
        .returning()
        .pipe(
          Effect.Effect.map((rows: Subscriber[]) => rows[0]),
          Effect.Effect.flatMap((row) =>
            row
              ? Effect.Effect.succeed(row)
              : Effect.Effect.fail(
                  new SubscriberNotFoundError({
                    identifier: `subscriberId:${subscriberId}`,
                  }),
                ),
          ),
        );

    const createSubscriber = (email: string) =>
      Effect.Effect.gen(function* () {
        const existing = yield* readSubscriberByEmail(email);

        if (existing.status === "unsubscribed") {
          return yield* db
            .update(subscriber)
            .set({
              status: "pending",
              subscribedAt: new Date(),
              unsubscribedAt: null,
            })
            .where(eq(subscriber.email, email))
            .returning()
            // biome-ignore lint/style/noNonNullAssertion: Database update returns at least one row.
            .pipe(Effect.Effect.map((rows: Subscriber[]) => rows[0]!));
        }

        return existing;
      }).pipe(
        Effect.Effect.catchTag("SubscriberNotFoundError", () =>
          db
            .insert(subscriber)
            .values({ email })
            .returning()
            // biome-ignore lint/style/noNonNullAssertion: Database insert returns at least one row.
            .pipe(Effect.Effect.map((rows: Subscriber[]) => rows[0]!)),
        ),
      );

    return SubscriberRepository.of({
      createSubscriber: Effect.Effect.fn("subscriber.repository.create")(
        function* (email: string) {
          yield* Effect.Effect.annotateCurrentSpan("email", email);
          return yield* createSubscriber(email);
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.catchTag("SqlError", (e) =>
              Effect.Effect.fail(new SubscriberRepositoryError({ cause: e })),
            ),
          ),
      ),
      readSubscriberByEmail: Effect.Effect.fn(
        "subscriber.repository.readByEmail",
      )(
        function* (email: string) {
          return yield* readSubscriberByEmail(email);
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.catchTag("SqlError", (e) =>
              Effect.Effect.fail(new SubscriberRepositoryError({ cause: e })),
            ),
          ),
      ),
      readSubscriberById: Effect.Effect.fn("subscriber.repository.readById")(
        function* (subscriberId: string) {
          yield* Effect.Effect.annotateCurrentSpan(
            "subscriberId",
            subscriberId,
          );
          return yield* readSubscriberById(subscriberId);
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.catchTag("SqlError", (e) =>
              Effect.Effect.fail(new SubscriberRepositoryError({ cause: e })),
            ),
          ),
      ),
      updateSubscriberById: Effect.Effect.fn(
        "subscriber.repository.updateById",
      )(
        function* (subscriberId: string, updates: Partial<Subscriber>) {
          yield* Effect.Effect.annotateCurrentSpan(
            "subscriberId",
            subscriberId,
          );
          return yield* updateSubscriberById(subscriberId, updates);
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.catchTag("SqlError", (e) =>
              Effect.Effect.fail(new SubscriberRepositoryError({ cause: e })),
            ),
          ),
      ),
    });
  }),
);
