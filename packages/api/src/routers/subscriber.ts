import { DatabaseLive } from "@gemhog/core/drizzle";
import {
  createToken,
  EmailServiceConsole,
  EmailServiceTag,
  makeEmailServiceLive,
  SubscriberServiceLive,
  SubscriberServiceTag,
  verificationEmail,
} from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect, Layer } from "effect";
import { z } from "zod";

import { publicProcedure, router } from "../index";

const EmailLayers = Layer.mergeAll(
  env.SES_FROM_EMAIL
    ? makeEmailServiceLive(env.SES_FROM_EMAIL)
    : EmailServiceConsole,
  SubscriberServiceLive.pipe(Layer.provide(DatabaseLive)),
);

export const subscriberRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;
      const secret = env.BETTER_AUTH_SECRET;
      const appUrl = env.APP_URL;

      const program = Effect.gen(function* () {
        const subscriberService = yield* SubscriberServiceTag;
        const emailService = yield* EmailServiceTag;

        const result = yield* subscriberService.subscribe(email);

        const sub = yield* subscriberService.findByEmail(email);
        const shouldSendEmail = result.isNew || sub?.status === "pending";

        if (shouldSendEmail) {
          const token = yield* createToken(
            {
              email,
              action: "verify",
              expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
            },
            secret,
          );

          const unsubscribeToken = yield* createToken(
            {
              email,
              action: "unsubscribe",
              expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
            },
            secret,
          );

          const verifyUrl = `${appUrl}/verify?token=${token}`;
          const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;
          const { subject, html } = verificationEmail({ verifyUrl });

          yield* emailService.send({
            to: email,
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });
        }
      });

      await Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));

      return {
        message: "Check your email to confirm your subscription",
      };
    }),
});
