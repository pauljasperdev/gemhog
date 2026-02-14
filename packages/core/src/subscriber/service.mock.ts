import * as Effect from "effect";
import { SubscriberService } from "./service";
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

export const MockSubscriberService = Effect.Layer.succeed(
  SubscriberService,
  SubscriberService.of({
    subscribe: (_email) => Effect.Effect.succeed(mockSubscriber),
    verify: (_subscriberId) => Effect.Effect.void,
    unsubscribe: (_subscriberId) => Effect.Effect.void,
  }),
);
