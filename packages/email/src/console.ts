import * as Effect from "effect";
import { EmailService } from "./service";

export const EmailServiceConsole = Effect.Layer.succeed(EmailService, {
  send: (to, email, headers) =>
    Effect.Effect.gen(function* () {
      const preview = email.text;

      yield* Effect.Console.log(
        `[EMAIL] To: ${to} | Subject: ${email.subject}`,
      );
      yield* Effect.Console.log(`[EMAIL] Content: ${preview}`);
      if (headers) {
        yield* Effect.Console.log(
          `[EMAIL] Headers: ${JSON.stringify(headers)}`,
        );
      }
    }).pipe(Effect.Effect.withSpan("email.send")),
});
