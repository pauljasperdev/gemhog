import { ServerEnvService } from "@gemhog/env/server";
import { Console, Context, Effect, Layer, Schedule } from "effect";
import { Resend } from "resend";
import { EmailSendError } from "./email.errors";
import type { EmailContent } from "./email.templates";

export interface SendEmailParams {
  to: string;
  email: EmailContent;
  headers?: Record<string, string>;
}

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  {
    readonly send: (
      params: SendEmailParams,
    ) => Effect.Effect<void, EmailSendError>;
  }
>() {}

export const EmailServiceConsole = Layer.succeed(EmailService, {
  send: (params) =>
    Effect.gen(function* () {
      const preview = params.email.text;

      yield* Console.log(
        `[EMAIL] To: ${params.to} | Subject: ${params.email.subject}`,
      );
      yield* Console.log(`[EMAIL] Content: ${preview}`);
      if (params.headers) {
        yield* Console.log(
          `[EMAIL] Headers: ${JSON.stringify(params.headers)}`,
        );
      }
    }),
});

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

const retrySchedule = Schedule.exponential("500 millis").pipe(
  Schedule.compose(Schedule.recurs(3)),
);

const FROM_EMAIL = "Gemhog <hello@gemhog.com>";

export const EmailServiceLive = Layer.effect(
  EmailService,
  Effect.gen(function* () {
    const { RESEND_API_KEY } = yield* ServerEnvService;
    const resend = new Resend(RESEND_API_KEY);

    return {
      send: ({ to, email, headers }) =>
        Effect.tryPromise({
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
          Effect.retry({ schedule: retrySchedule, while: isTransientError }),
          Effect.asVoid,
        ),
    };
  }),
);
