import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { SubscriberNotFoundError } from "../errors";
import { SubscriberService } from "../service";
import type { Subscriber } from "../sql";

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

const crudStubs = {
  createSubscriber: (email: string) =>
    Effect.succeed(makeTestSubscriber({ id: "test-id", email })),
  readSubscriberById: (id: string) =>
    Effect.succeed(makeTestSubscriber({ id })),
  readSubscriberByEmail: (email: string) =>
    Effect.succeed(makeTestSubscriber({ email })),
  updateSubscriberById: (id: string, updates: Partial<Subscriber>) =>
    Effect.succeed(makeTestSubscriber({ id, ...updates })),
};

describe("SubscriberService", () => {
  describe("subscribe", () => {
    it("creates a new subscriber with pending status", async () => {
      const sub = makeTestSubscriber({ id: "new-id", status: "pending" });
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) => Effect.succeed(sub),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("new@example.com")),
          Effect.provide(TestLayer),
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
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) => Effect.succeed(sub),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("pending@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("existing-id");
      expect(result.status).toBe("pending");
    });

    it("returns existing subscriber for active email (silent success)", async () => {
      const sub = makeTestSubscriber({ id: "active-id", status: "active" });
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) => Effect.succeed(sub),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("active@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("active-id");
      expect(result.status).toBe("active");
    });

    it("resets to pending for resubscribe after unsubscribed", async () => {
      const sub = makeTestSubscriber({ id: "resub-id", status: "pending" });
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) => Effect.succeed(sub),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("unsub@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.id).toBe("resub-id");
      expect(result.status).toBe("pending");
    });
  });

  describe("verify", () => {
    it("sets status to active and verifiedAt", async () => {
      let verified = false;
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => {
          verified = true;
          return Effect.void;
        },
        unsubscribe: (_subscriberId) => Effect.void,
      });

      await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.verify("test-id")),
          Effect.provide(TestLayer),
        ),
      );

      expect(verified).toBe(true);
    });

    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) =>
          Effect.fail(
            new SubscriberNotFoundError({ identifier: "id:missing-id" }),
          ),
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.verify("missing-id")),
          Effect.provide(TestLayer),
          Effect.either,
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
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => {
          unsubscribed = true;
          return Effect.void;
        },
      });

      await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.unsubscribe("test-id")),
          Effect.provide(TestLayer),
        ),
      );

      expect(unsubscribed).toBe(true);
    });

    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        subscribe: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) =>
          Effect.fail(
            new SubscriberNotFoundError({ identifier: "id:missing-id" }),
          ),
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.unsubscribe("missing-id")),
          Effect.provide(TestLayer),
          Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
      }
    });
  });

  describe("readSubscriberByEmail", () => {
    it("returns subscriber when found", async () => {
      const sub = makeTestSubscriber({ email: "found@example.com" });
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        readSubscriberByEmail: (_email) => Effect.succeed(sub),
        subscribe: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("found@example.com"),
          ),
          Effect.provide(TestLayer),
        ),
      );

      expect(result).not.toBeNull();
      expect(result?.email).toBe("found@example.com");
    });

    it("fails with SubscriberNotFoundError when not found", async () => {
      const TestLayer = Layer.succeed(SubscriberService, {
        ...crudStubs,
        readSubscriberByEmail: (email) =>
          Effect.fail(
            new SubscriberNotFoundError({ identifier: `email:${email}` }),
          ),
        subscribe: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
        verify: (_subscriberId) => Effect.void,
        unsubscribe: (_subscriberId) => Effect.void,
      });

      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("missing@example.com"),
          ),
          Effect.provide(TestLayer),
          Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
      }
    });
  });
});
