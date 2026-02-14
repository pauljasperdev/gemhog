import * as Effect from "effect";
import type { EmailSendError } from "./errors";
import type { EmailContent } from "./templates";

interface EmailServiceShape {
  readonly send: (
    to: string,
    email: EmailContent,
    headers?: Record<string, string>,
  ) => Effect.Effect.Effect<void, EmailSendError>;
}

export class EmailService extends Effect.Context.Tag(
  "@gemhog/email/EmailService",
)<EmailService, EmailServiceShape>() {}
