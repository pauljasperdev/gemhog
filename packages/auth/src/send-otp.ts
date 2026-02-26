import { EmailService, EmailServiceLayer, signInOtpEmail } from "@gemhog/email";
import * as Effect from "effect";

export function sendOtpEmail(to: string, otp: string) {
  return Effect.Effect.gen(function* () {
    const content = yield* Effect.Effect.promise(() => signInOtpEmail({ otp }));
    const emailService = yield* EmailService;
    yield* emailService.send(to, content);
  }).pipe(Effect.Effect.provide(EmailServiceLayer));
}
