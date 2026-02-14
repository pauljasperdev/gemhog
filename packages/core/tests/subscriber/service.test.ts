import * as Effect from "effect";
import { describe, expect, it } from "vitest";
import { SubscriberNotFoundError } from "../../src/subscriber/errors";
import { SubscriberService } from "../../src/subscriber/service";
import type { Subscriber } from "../../src/subscriber/sql";

function makeTestSubscriber(overrides?: Partial<Subscriber>): Subscriber {
  return {
    id: overrides?.id ?? "test-id",
    email: overrides?.email ?? "test@example.com",
    status: overrides?.status ?? "pending",
    subscribedAt: overrides?.subscribedAt ?? new Date(),
    verifiedAt: overrides?.verifiedAt ?? null,
    unsubscribedAt: overrides?.unsubscribedAt ?? null,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

describe("SubscriberService", () => {
  describe("subscribe", () => {
    it("creates a new subscriber with pending status", async () => {
      const sub = makeTestSubscriber({ id: "new-id", status: "pending" });
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) => Effect.Effect.succeed(sub),
        verify: (_subscriberId) => Effect.Effect.succeed(undefined),
        unsubscribe: (_subscriberId) => Effect.Effect.succeed(undefined),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("new@example.com"),
          ),
          Effect.Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("new-id");
      expect(result.status).toBe("pending");
    });

    it("returns existing subscriber for duplicate pending email", async () => {
      const sub = makeTestSubscriber({
        id: "existing-id",
        status: "pending",
      });
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) => Effect.Effect.succeed(sub),
        verify: (_subscriberId) => Effect.Effect.succeed(undefined),
        unsubscribe: (_subscriberId) => Effect.Effect.succeed(undefined),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("pending@example.com"),
          ),
          Effect.Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("existing-id");
      expect(result.status).toBe("pending");
    });

    it("returns existing subscriber for active email (silent success)", async () => {
      const sub = makeTestSubscriber({ id: "active-id", status: "active" });
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) => Effect.Effect.succeed(sub),
        verify: (_subscriberId) => Effect.Effect.succeed(undefined),
        unsubscribe: (_subscriberId) => Effect.Effect.succeed(undefined),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("active@example.com"),
          ),
          Effect.Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("active-id");
      expect(result.status).toBe("active");
    });

    it("resets to pending for resubscribe after unsubscribed", async () => {
      const sub = makeTestSubscriber({ id: "resub-id", status: "pending" });
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) => Effect.Effect.succeed(sub),
        verify: (_subscriberId) => Effect.Effect.succeed(undefined),
        unsubscribe: (_subscriberId) => Effect.Effect.succeed(undefined),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("unsub@example.com"),
          ),
          Effect.Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("resub-id");
      expect(result.status).toBe("pending");
    });
  });

  describe("verify", () => {
    it("sets status to active and verifiedAt", async () => {
      let verified = false;
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => {
          verified = true;
          return Effect.Effect.succeed(undefined);
        },
        unsubscribe: (_subscriberId) => Effect.Effect.succeed(undefined),
      });

      await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("test-id")),
          Effect.Effect.provide(TestLayer),
        ),
      );

      expect(verified).toBe(true);
    });

    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) =>
          Effect.Effect.fail(
            new SubscriberNotFoundError({ identifier: "id:missing-id" }),
          ),
        unsubscribe: (_subscriberId) => Effect.Effect.succeed(undefined),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("missing-id")),
          Effect.Effect.provide(TestLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
      }
    });
  });

  describe("unsubscribe", () => {
    it("sets status to unsubscribed and unsubscribedAt", async () => {
      let unsubscribed = false;
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => Effect.Effect.succeed(undefined),
        unsubscribe: (_subscriberId) => {
          unsubscribed = true;
          return Effect.Effect.succeed(undefined);
        },
      });

      await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.unsubscribe("test-id")),
          Effect.Effect.provide(TestLayer),
        ),
      );

      expect(unsubscribed).toBe(true);
    });

    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const TestLayer = Effect.Layer.succeed(SubscriberService, {
        subscribe: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => Effect.Effect.succeed(undefined),
        unsubscribe: (_subscriberId) =>
          Effect.Effect.fail(
            new SubscriberNotFoundError({ identifier: "id:missing-id" }),
          ),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.unsubscribe("missing-id")),
          Effect.Effect.provide(TestLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
      }
    });
  });
});
