import { EmailService, EmailServiceLayer, signInOtpEmail } from "@gemhog/email";
import * as Effect from "effect";
import { annotateCurrentSpan } from "effect/Effect";

export const sendOtpEmail = Effect.Effect.fn("auth.sendOtp")(
  function* (to: string, otp: string) {
    yield* annotateCurrentSpan("email.to", to);
    const content = yield* Effect.Effect.promise(() => signInOtpEmail({ otp }));
    const emailService = yield* EmailService;
    yield* emailService.send(to, content);
  },
  (effect) => effect.pipe(Effect.Effect.provide(EmailServiceLayer)),
);
