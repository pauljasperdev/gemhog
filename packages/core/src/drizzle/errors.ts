import { Data } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
  cause?: unknown;
}> {}

export class ConnectionError extends Data.TaggedError("ConnectionError")<{
  message: string;
  cause?: unknown;
}> {}
