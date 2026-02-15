import { EmailService, verificationEmail } from "@gemhog/email";
import * as Effect from "effect";
import { SubscriberServiceError } from "./errors";
import { SubscriberRepository } from "./repository";
import { SubscriberService } from "./service";
import { createToken } from "./token";

export const SubscriberServiceLive = Effect.Layer.effect(
  SubscriberService,
  Effect.Effect.gen(function* () {
    const repository = yield* SubscriberRepository;
    const emailService = yield* EmailService;
    const appUrl = yield* Effect.Config.string("APP_URL");

    return SubscriberService.of({
      subscribe: (email) =>
        Effect.Effect.gen(function* () {
          const sub = yield* repository.createSubscriber(email);
          const shouldSendEmail = sub.status === "pending";

          if (shouldSendEmail) {
            const token = yield* createToken({
              email,
              action: "verify",
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            });

            const unsubscribeToken = yield* createToken({
              email,
              action: "unsubscribe",
              expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
            });

            const verifyUrl = `${appUrl}/verify?token=${token}`;
            const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;
            const { subject, html, text } = verificationEmail({ verifyUrl });

            yield* emailService.send(
              email,
              { subject, html, text },
              {
                "List-Unsubscribe": `<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            );
          }

          return sub;
        }).pipe(
          Effect.Effect.catchTags({
            SubscriberRepositoryError: (e) =>
              Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
            ConfigError: (e) =>
              Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
            EmailSendError: (e) =>
              Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
          }),
          Effect.Effect.withSpan("subscriber.subscribe"),
        ),

      verify: (subscriberId) =>
        repository.readSubscriberById(subscriberId).pipe(
          Effect.Effect.flatMap(() =>
            repository.updateSubscriberById(subscriberId, {
              status: "active",
              verifiedAt: new Date(),
            }),
          ),
          Effect.Effect.asVoid,
          Effect.Effect.catchTag("SubscriberRepositoryError", (e) =>
            Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
          ),
          Effect.Effect.withSpan("subscriber.verify"),
        ),

      unsubscribe: (subscriberId) =>
        repository.readSubscriberById(subscriberId).pipe(
          Effect.Effect.flatMap(() =>
            repository.updateSubscriberById(subscriberId, {
              status: "unsubscribed",
              unsubscribedAt: new Date(),
            }),
          ),
          Effect.Effect.asVoid,
          Effect.Effect.catchTag("SubscriberRepositoryError", (e) =>
            Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
          ),
          Effect.Effect.withSpan("subscriber.unsubscribe"),
        ),
    });
  }),
);
