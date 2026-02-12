import { Data } from "effect";

export class EmailSendError extends Data.TaggedError("EmailSendError")<{
  message: string;
  cause?: unknown;
}> {}
