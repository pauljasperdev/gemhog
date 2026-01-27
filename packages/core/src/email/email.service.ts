import { Context, Effect, Layer } from "effect";
import type { EmailSendError } from "./email.errors";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
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
    Effect.sync(() => {
      const preview =
        params.html.length > 200
          ? `${params.html.slice(0, 200)}...`
          : params.html;
      console.log(`[EMAIL] To: ${params.to} | Subject: ${params.subject}`);
      console.log(`[EMAIL] HTML: ${preview}`);
      if (params.headers) {
        console.log(`[EMAIL] Headers: ${JSON.stringify(params.headers)}`);
      }
    }),
});
