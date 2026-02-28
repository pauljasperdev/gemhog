import {
  type EmailContent,
  EmailService,
  verificationEmail,
} from "@gemhog/email";
import * as Effect from "effect";
import { annotateCurrentSpan } from "effect/Effect";
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
      subscribe: Effect.Effect.fn("subscriber.service.subscribe")(
        function* (email: string) {
          yield* annotateCurrentSpan("email", email);
          const sub = yield* repository.createSubscriber(email);
          const shouldSendEmail = sub.status === "pending";

          if (shouldSendEmail) {
            const token = yield* createToken({
              email,
              action: "verify",
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            });

            const verifyUrl = `${appUrl}/verify?token=${token}`;
            const { subject, html, text } =
              yield* Effect.Effect.promise<EmailContent>(() =>
                verificationEmail({ verifyUrl }),
              );

            yield* emailService.send(email, { subject, html, text });
          }

          return sub;
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.catchTags({
              SubscriberRepositoryError: (e) =>
                Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
              ConfigError: (e) =>
                Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
              EmailSendError: (e) =>
                Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
            }),
          ),
      ),

      verify: Effect.Effect.fn("subscriber.service.verify")(
        function* (subscriberId: string) {
          yield* annotateCurrentSpan("subscriberId", subscriberId);
          yield* repository.readSubscriberById(subscriberId);
          yield* repository.updateSubscriberById(subscriberId, {
            status: "active",
            verifiedAt: new Date(),
          });
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.asVoid,
            Effect.Effect.catchTag("SubscriberRepositoryError", (e) =>
              Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
            ),
          ),
      ),

      unsubscribe: Effect.Effect.fn("subscriber.service.unsubscribe")(
        function* (subscriberId: string) {
          yield* annotateCurrentSpan("subscriberId", subscriberId);
          yield* repository.readSubscriberById(subscriberId);
          yield* repository.updateSubscriberById(subscriberId, {
            status: "unsubscribed",
            unsubscribedAt: new Date(),
          });
        },
        (eff) =>
          eff.pipe(
            Effect.Effect.asVoid,
            Effect.Effect.catchTag("SubscriberRepositoryError", (e) =>
              Effect.Effect.fail(new SubscriberServiceError({ cause: e })),
            ),
          ),
      ),
    });
  }),
);
