import { Effect, Layer } from "effect";
import { EmailServiceTag } from "./email.service";
import { SubscriberServiceTag } from "./subscriber.service";

export const MockEmailService = Layer.succeed(EmailServiceTag, {
  send: (_params) => Effect.void,
});

export const MockSubscriberService = Layer.succeed(SubscriberServiceTag, {
  subscribe: (_email) => Effect.succeed({ id: "mock-id", isNew: true }),
  verify: (_email) => Effect.void,
  unsubscribe: (_email) => Effect.void,
  findByEmail: (_email) => Effect.succeed(null),
});
