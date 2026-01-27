import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { Context, Effect, Layer } from "effect";
import { EmailSendError } from "./email.errors";

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

export const EmailServiceLive = Layer.sync(EmailServiceTag, () => {
  const client = new SESv2Client({
    region: process.env.AWS_REGION ?? "eu-central-1",
  });
  const senderEmail = process.env.SES_FROM_EMAIL ?? "hello@gemhog.com";

  return {
    send: ({ to, subject, html, headers }) =>
      Effect.tryPromise({
        try: () =>
          client.send(
            new SendEmailCommand({
              FromEmailAddress: senderEmail,
              Destination: { ToAddresses: [to] },
              Content: {
                Simple: {
                  Subject: { Data: subject },
                  Body: { Html: { Data: html } },
                  Headers: headers
                    ? Object.entries(headers).map(([name, value]) => ({
                        Name: name,
                        Value: value,
                      }))
                    : undefined,
                },
              },
            }),
          ),
        catch: (error) =>
          new EmailSendError({
            message: `Failed to send email to ${to}`,
            cause: error,
          }),
      }),
  };
});

export const EmailServiceAuto = process.env.SES_FROM_EMAIL
  ? EmailServiceLive
  : EmailServiceConsole;
