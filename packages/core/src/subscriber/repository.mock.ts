import * as Effect from "effect";
import { SubscriberRepository } from "./repository";
import type { Subscriber } from "./sql";

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

export const MockSubscriberRepository = Effect.Layer.succeed(
  SubscriberRepository,
  SubscriberRepository.of({
    createSubscriber: (email) =>
      Effect.Effect.succeed({ ...mockSubscriber, email }),
    readSubscriberById: (_id) => Effect.Effect.succeed(mockSubscriber),
    readSubscriberByEmail: (_email) => Effect.Effect.succeed(mockSubscriber),
    updateSubscriberById: (_id, updates) =>
      Effect.Effect.succeed({ ...mockSubscriber, ...updates }),
  }),
);
