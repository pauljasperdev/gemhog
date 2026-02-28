import * as Effect from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import { EmailService } from "./service";
import type { EmailContent } from "./templates";

export const EmailServiceConsole = Effect.Layer.succeed(EmailService, {
  send: Effect.Effect.fn("email.console.send")(function* (
    to: string,
    email: EmailContent,
    headers?: Record<string, string>,
  ) {
    yield* annotateCurrentSpan("email.to", to);
    const preview = email.text;

    yield* Effect.Console.log(`[EMAIL] To: ${to} | Subject: ${email.subject}`);
    yield* Effect.Console.log(`[EMAIL] Content: ${preview}`);
    if (headers) {
      yield* Effect.Console.log(`[EMAIL] Headers: ${JSON.stringify(headers)}`);
    }
  }),
});
