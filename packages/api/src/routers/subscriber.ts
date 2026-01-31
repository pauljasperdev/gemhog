import { DatabaseLive } from "@gemhog/core/drizzle";
import {
  createToken,
  EmailServiceTag,
  makeEmailLayers,
  SubscriberServiceTag,
  verificationEmail,
} from "@gemhog/core/email";
import { env } from "@gemhog/env/server";
import { Effect } from "effect";
import { z } from "zod";

import { publicProcedure, router } from "../index";

const EmailLayers = makeEmailLayers(
  env.RESEND_API_KEY,
  "Gemhog <hello@gemhog.com>",
  DatabaseLive,
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
      });

      await Effect.runPromise(program.pipe(Effect.provide(EmailLayers)));

      return {
        message: "Check your email to confirm your subscription",
      };
    }),
});
