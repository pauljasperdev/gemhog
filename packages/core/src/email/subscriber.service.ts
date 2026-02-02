import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import {
  type EmailSendError,
  SubscriberError,
  SubscriberNotFoundError,
} from "./email.errors";
import { EmailService } from "./email.service";
import { verificationEmail } from "./email.templates";
import { type Subscriber, subscriber } from "./subscriber.sql";
import { createToken } from "./token";

export class SubscriberService extends Context.Tag("SubscriberService")<
  SubscriberService,
  {
    // CRUD
    readonly createSubscriber: (
      email: string,
    ) => Effect.Effect<{ id: string; isNew: boolean }, SubscriberError>;
    readonly readSubscriberById: (
      subscriberId: string,
    ) => Effect.Effect<Subscriber | null, SubscriberError>;
    readonly readSubscriberByEmail: (
      email: string,
    ) => Effect.Effect<Subscriber | null, SubscriberError>;
    readonly updateSubscriberById: (
      subscriberId: string,
      updates: Partial<Subscriber>,
    ) => Effect.Effect<void, SubscriberError>;

    // High-level
    readonly subscribe: (
      email: string,
    ) => Effect.Effect<Subscriber, SubscriberError | EmailSendError>;
    readonly verify: (
      subscriberId: string,
    ) => Effect.Effect<void, SubscriberNotFoundError | SubscriberError>;
    readonly unsubscribe: (
      subscriberId: string,
    ) => Effect.Effect<void, SubscriberNotFoundError | SubscriberError>;
  }
>() {}

export const makeSubscriberServiceLive = (config: {
  secret: string;
  appUrl: string;
}) =>
  Layer.effect(
    SubscriberService,
    Effect.gen(function* () {
      const db = yield* PgDrizzle;
      const emailService = yield* EmailService;

      const createSubscriber = (
        email: string,
      ): Effect.Effect<{ id: string; isNew: boolean }, SubscriberError> =>
        Effect.gen(function* () {
          const existing = yield* readSubscriberByEmail(email);

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
        });

      const readSubscriberByEmail = (
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

      const readSubscriberById = (
        id: string,
      ): Effect.Effect<Subscriber | null, SubscriberError> =>
        db
          .select()
          .from(subscriber)
          .where(eq(subscriber.id, id))
          .pipe(
            Effect.map((rows: Subscriber[]) => rows[0] ?? null),
            Effect.mapError(
              (error) =>
                new SubscriberError({
                  message: `Failed to find subscriber by id: ${id}`,
                  cause: error,
                }),
            ),
          );

      const updateSubscriberById = (
        subscriberId: string,
        updates: Partial<Subscriber>,
      ): Effect.Effect<void, SubscriberError> =>
        db
          .update(subscriber)
          .set(updates)
          .where(eq(subscriber.id, subscriberId))
          .pipe(
            Effect.mapError(
              (error) =>
                new SubscriberError({
                  message: `Failed to update subscriber: ${subscriberId}`,
                  cause: error,
                }),
            ),
            Effect.asVoid,
          );

      const requireById = (
        id: string,
      ): Effect.Effect<Subscriber, SubscriberNotFoundError | SubscriberError> =>
        readSubscriberById(id).pipe(
          Effect.flatMap((sub) =>
            sub
              ? Effect.succeed(sub)
              : Effect.fail(new SubscriberNotFoundError({ email: `id:${id}` })),
          ),
        );

      const subscribe = (
        email: string,
      ): Effect.Effect<Subscriber, SubscriberError | EmailSendError> =>
        Effect.gen(function* () {
          const result = yield* createSubscriber(email);

          const sub = yield* readSubscriberByEmail(email);
          const shouldSendEmail = result.isNew || sub?.status === "pending";

          if (shouldSendEmail) {
            const token = yield* createToken(
              {
                email,
                action: "verify",
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
              },
              config.secret,
            );

            const unsubscribeToken = yield* createToken(
              {
                email,
                action: "unsubscribe",
                expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
              },
              config.secret,
            );

            const verifyUrl = `${config.appUrl}/verify?token=${token}`;
            const unsubscribeUrl = `${config.appUrl}/api/unsubscribe?token=${unsubscribeToken}`;
            const { subject, html, text } = verificationEmail({ verifyUrl });

            yield* emailService.send({
              to: email,
              email: { subject, html, text },
              headers: {
                "List-Unsubscribe": `<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            });
          }

          const fresh = yield* readSubscriberByEmail(email);
          if (!fresh) {
            return yield* Effect.fail(
              new SubscriberError({
                message: `Subscriber disappeared after creation: ${email}`,
              }),
            );
          }
          return fresh;
        });

      const verify = (
        subscriberId: string,
      ): Effect.Effect<void, SubscriberNotFoundError | SubscriberError> =>
        requireById(subscriberId).pipe(
          Effect.flatMap(() =>
            updateSubscriberById(subscriberId, {
              status: "active",
              verifiedAt: new Date(),
            }),
          ),
        );

      const unsubscribe = (
        subscriberId: string,
      ): Effect.Effect<void, SubscriberNotFoundError | SubscriberError> =>
        requireById(subscriberId).pipe(
          Effect.flatMap(() =>
            updateSubscriberById(subscriberId, {
              status: "unsubscribed",
              unsubscribedAt: new Date(),
            }),
          ),
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
