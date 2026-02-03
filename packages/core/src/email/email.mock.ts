import { Effect, Layer } from "effect";
import { EmailService } from "./email.service";
import { SubscriberService } from "./subscriber.service";
import type { Subscriber } from "./subscriber.sql";

const mockSubscriber: Subscriber = {
  id: "mock-id",
  email: "mock@example.com",
  status: "pending",
  subscribedAt: new Date(),
  verifiedAt: null,
  unsubscribedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MockEmailService = Layer.succeed(EmailService, {
  send: (_params) => Effect.void,
});

export const MockSubscriberService = Layer.succeed(SubscriberService, {
  createSubscriber: (email) => Effect.succeed({ ...mockSubscriber, email }),
  readSubscriberById: (_id) => Effect.succeed(mockSubscriber),
  readSubscriberByEmail: (_email) => Effect.succeed(mockSubscriber),
  updateSubscriberById: (_id, updates) =>
    Effect.succeed({ ...mockSubscriber, ...updates }),
  subscribe: (_email) => Effect.succeed(mockSubscriber),
  verify: (_subscriberId) => Effect.void,
  unsubscribe: (_subscriberId) => Effect.void,
});
