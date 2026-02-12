import type { SqlError } from "@effect/sql/SqlError";
import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import type { EmailSendError } from "@gemhog/email";
import { EmailService, verificationEmail } from "@gemhog/email";
import { eq } from "drizzle-orm";
import { Config, Console, Context, Effect, Layer } from "effect";
import type { ConfigError } from "effect/ConfigError";
import { SubscriberNotFoundError } from "./errors";
import { type Subscriber, subscriber } from "./sql";
import { createToken } from "./token";

export class SubscriberService extends Context.Tag("SubscriberService")<
  SubscriberService,
  {
    readonly createSubscriber: (
      email: string,
    ) => Effect.Effect<Subscriber, SqlError>;
    readonly readSubscriberById: (
      subscriberId: string,
    ) => Effect.Effect<Subscriber, SqlError | SubscriberNotFoundError>;
    readonly readSubscriberByEmail: (
      email: string,
    ) => Effect.Effect<Subscriber, SqlError | SubscriberNotFoundError>;
    readonly updateSubscriberById: (
      subscriberId: string,
      updates: Partial<Subscriber>,
    ) => Effect.Effect<Subscriber, SqlError | SubscriberNotFoundError>;
    readonly subscribe: (
      email: string,
    ) => Effect.Effect<Subscriber, EmailSendError | SqlError | ConfigError>;
    readonly verify: (
      subscriberId: string,
    ) => Effect.Effect<void, SqlError | SubscriberNotFoundError>;
    readonly unsubscribe: (
      subscriberId: string,
    ) => Effect.Effect<void, SqlError | SubscriberNotFoundError>;
  }
>() {}

export const SubscriberServiceLive = Layer.effect(
  SubscriberService,
  Effect.gen(function* () {
    const db = yield* PgDrizzle;
    const emailService = yield* EmailService;

    const createSubscriber = (
      email: string,
    ): Effect.Effect<Subscriber, SqlError> =>
      Effect.gen(function* () {
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
            .pipe(Effect.map((rows: Subscriber[]) => rows[0]!));
        }

        return existing;
      })
        .pipe(
          Effect.catchTag("SubscriberNotFoundError", () =>
            Effect.gen(function* () {
              return yield* db
                .insert(subscriber)
                .values({ email })
                .returning()
                // biome-ignore lint/style/noNonNullAssertion: Database insert returns at least one row.
                .pipe(Effect.map((rows: Subscriber[]) => rows[0]!));
            }),
          ),
        )
        .pipe(Effect.withSpan("subscriber.create"));

    const readSubscriberByEmail = (
      email: string,
    ): Effect.Effect<Subscriber, SqlError | SubscriberNotFoundError> =>
      db
        .select()
        .from(subscriber)
        .where(eq(subscriber.email, email))
        .pipe(
          Effect.map((rows: Subscriber[]) => rows[0]),
          Effect.flatMap((row) =>
            row
              ? Effect.succeed(row)
              : Effect.fail(
                  new SubscriberNotFoundError({ identifier: `email:${email}` }),
                ),
          ),
        );

    const readSubscriberById = (
      subscriberId: string,
    ): Effect.Effect<Subscriber, SqlError | SubscriberNotFoundError> =>
      db
        .select()
        .from(subscriber)
        .where(eq(subscriber.id, subscriberId))
        .pipe(
          Effect.map((rows: Subscriber[]) => rows[0]),
          Effect.flatMap((row) =>
            row
              ? Effect.succeed(row)
              : Effect.fail(
                  new SubscriberNotFoundError({
                    identifier: `subscriberId:${subscriberId}`,
                  }),
                ),
          ),
        );

    const updateSubscriberById = (
      subscriberId: string,
      updates: Partial<Subscriber>,
    ): Effect.Effect<Subscriber, SqlError | SubscriberNotFoundError> =>
      db
        .update(subscriber)
        .set(updates)
        .where(eq(subscriber.id, subscriberId))
        .returning()
        .pipe(
          Effect.map((rows: Subscriber[]) => rows[0]),
          Effect.flatMap((row) =>
            row
              ? Effect.succeed(row)
              : Effect.fail(
                  new SubscriberNotFoundError({
                    identifier: `subscriberId:${subscriberId}`,
                  }),
                ),
          ),
        );

    const subscribe = (
      email: string,
    ): Effect.Effect<Subscriber, EmailSendError | SqlError | ConfigError> =>
      Effect.gen(function* () {
        const APP_URL = yield* Config.string("APP_URL").pipe(
          Effect.tapErrorCause((cause) =>
            Console.error(
              `[SubscriberService] APP_URL config failed for ${email}: ${String(cause)}`,
            ),
          ),
        );

        const sub = yield* createSubscriber(email).pipe(
          Effect.tapErrorCause((cause) =>
            Console.error(
              `[SubscriberService] createSubscriber failed for ${email}: ${String(cause)}`,
            ),
          ),
        );
        const shouldSendEmail = sub.status === "pending";

        if (shouldSendEmail) {
          const token = yield* createToken({
            email,
            action: "verify",
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          }).pipe(
            Effect.tapErrorCause((cause) =>
              Console.error(
                `[SubscriberService] verify token failed for ${email}: ${String(cause)}`,
              ),
            ),
          );

          const unsubscribeToken = yield* createToken({
            email,
            action: "unsubscribe",
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          }).pipe(
            Effect.tapErrorCause((cause) =>
              Console.error(
                `[SubscriberService] unsubscribe token failed for ${email}: ${String(cause)}`,
              ),
            ),
          );

          const verifyUrl = `${APP_URL}/verify?token=${token}`;
          const unsubscribeUrl = `${APP_URL}/api/unsubscribe?token=${unsubscribeToken}`;
          const { subject, html, text } = verificationEmail({ verifyUrl });

          yield* emailService
            .send({
              to: email,
              email: { subject, html, text },
              headers: {
                "List-Unsubscribe": `<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            })
            .pipe(
              Effect.tapErrorCause((cause) =>
                Console.error(
                  `[SubscriberService] email send failed for ${email}: ${String(cause)}`,
                ),
              ),
            );
        }

        return sub;
      }).pipe(
        Effect.tapErrorCause((cause) =>
          Console.error(
            `[SubscriberService] subscribe failed for ${email}: ${String(cause)}`,
          ),
        ),
        Effect.withSpan("subscriber.subscribe"),
      );

    const verify = (
      subscriberId: string,
    ): Effect.Effect<void, SqlError | SubscriberNotFoundError> =>
      readSubscriberById(subscriberId).pipe(
        Effect.flatMap(() =>
          updateSubscriberById(subscriberId, {
            status: "active",
            verifiedAt: new Date(),
          }),
        ),
        Effect.withSpan("subscriber.verify"),
      );

    const unsubscribe = (
      subscriberId: string,
    ): Effect.Effect<void, SqlError | SubscriberNotFoundError> =>
      readSubscriberById(subscriberId).pipe(
        Effect.flatMap(() =>
          updateSubscriberById(subscriberId, {
            status: "unsubscribed",
            unsubscribedAt: new Date(),
          }),
        ),
        Effect.withSpan("subscriber.unsubscribe"),
      );

    return {
      createSubscriber,
      readSubscriberById,
      readSubscriberByEmail,
      updateSubscriberById,
      subscribe,
      verify,
      unsubscribe,
    };
  }),
);
