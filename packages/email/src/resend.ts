import * as Effect from "effect";
import { Resend } from "resend";
import { EmailSendError } from "./errors";
import { EmailService } from "./service";

const TRANSIENT_ERROR_NAMES = new Set([
  "rate_limit_exceeded",
  "daily_quota_exceeded",
  "monthly_quota_exceeded",
  "application_error",
  "internal_server_error",
]);

function isTransientError(error: EmailSendError): boolean {
  const cause = error.cause as Record<string, unknown> | undefined;
  if (!cause) return false;
  if (typeof cause.name === "string" && TRANSIENT_ERROR_NAMES.has(cause.name))
    return true;
  if (typeof cause.statusCode === "number" && cause.statusCode >= 500)
    return true;
  return false;
}

const retrySchedule = Effect.Schedule.exponential("500 millis").pipe(
  Effect.Schedule.compose(Effect.Schedule.recurs(3)),
);

const FROM_EMAIL = "Gemhog <hello@gemhog.com>";

export const EmailServiceLive = Effect.Layer.effect(
  EmailService,
  Effect.Effect.gen(function* () {
    const RESEND_API_KEY = yield* Effect.Config.string("RESEND_API_KEY");
    const resend = new Resend(RESEND_API_KEY);

    return EmailService.of({
      send: (to, email, headers) =>
        Effect.Effect.tryPromise({
          try: async () => {
            const { error } = await resend.emails.send({
              from: FROM_EMAIL,
              to: [to],
              subject: email.subject,
              html: email.html,
              headers,
            });
            if (error) throw error;
          },
          catch: (error) =>
            new EmailSendError({
              message: `Failed to send email to ${to}`,
              cause: error,
            }),
        }).pipe(
          Effect.Effect.tapErrorCause((cause) =>
            Effect.Console.error(
              `[EmailService] send failed for ${to}: ${String(cause)}`,
            ),
          ),
          Effect.Effect.retry({
            schedule: retrySchedule,
            while: isTransientError,
          }),
          Effect.Effect.withSpan("email.send"),
        ),
    });
  }),
);
