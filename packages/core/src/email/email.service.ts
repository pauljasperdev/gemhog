import { Console, Context, Effect, Layer, Schedule } from "effect";
import { Resend } from "resend";
import { EmailSendError } from "./email.errors";

export interface SendEmailParams {
  to: string;
  subject: string;
  content: { html: string; text?: string };
  headers?: Record<string, string>;
}

export interface EmailService {
  readonly send: (
    params: SendEmailParams,
  ) => Effect.Effect<void, EmailSendError>;
}

export class EmailServiceTag extends Context.Tag("EmailService")<
  EmailServiceTag,
  EmailService
>() {}

export const EmailServiceConsole = Layer.succeed(EmailServiceTag, {
  send: (params) =>
    Effect.gen(function* () {
      const preview = params.content.text
        ? params.content.text.slice(0, 200)
        : params.content.html.length > 200
          ? `${params.content.html.slice(0, 200)}...`
          : params.content.html;
      yield* Console.log(
        `[EMAIL] To: ${params.to} | Subject: ${params.subject}`,
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

export const makeEmailServiceLive = (apiKey: string, fromEmail: string) =>
  Layer.sync(EmailServiceTag, () => {
    const resend = new Resend(apiKey);

    return {
      send: ({ to, subject, content, headers }) =>
        Effect.tryPromise({
          try: async () => {
            const { error } = await resend.emails.send({
              from: fromEmail,
              to: [to],
              subject,
              html: content.html,
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
  });
