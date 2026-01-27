import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { SubscriberNotFoundError } from "./email.errors";
import type { Subscriber, SubscriberService } from "./subscriber.service";
import { SubscriberServiceTag } from "./subscriber.service";

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
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) =>
          Effect.succeed({
            id: "new-id",
            isNew: true,
          }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) => Effect.succeed(null),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("new@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.isNew).toBe(true);
      expect(result.id).toBe("new-id");
    });

    it("returns isNew: false for existing pending email", async () => {
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) =>
          Effect.succeed({ id: "existing-id", isNew: false }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("pending@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.isNew).toBe(false);
    });

    it("returns isNew: false for existing active email (silent success)", async () => {
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) =>
          Effect.succeed({ id: "active-id", isNew: false }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "active" })),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("active@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.isNew).toBe(false);
    });

    it("returns isNew: true for resubscribe after unsubscribed", async () => {
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "resub-id", isNew: true }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "unsubscribed" })),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("unsub@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result.isNew).toBe(true);
    });
  });

  describe("verify", () => {
    it("sets status to active and verifiedAt", async () => {
      let verified = false;
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "id", isNew: true }),
        verify: (_email) => {
          verified = true;
          return Effect.void;
        },
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "pending" })),
      } satisfies SubscriberService);

      await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.verify("test@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(verified).toBe(true);
    });

    it("fails with SubscriberNotFoundError for nonexistent email", async () => {
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "id", isNew: true }),
        verify: (email) => Effect.fail(new SubscriberNotFoundError({ email })),
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) => Effect.succeed(null),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.verify("missing@example.com")),
          Effect.provide(TestLayer),
          Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
        expect((result.left as SubscriberNotFoundError).email).toBe(
          "missing@example.com",
        );
      }
    });
  });

  describe("unsubscribe", () => {
    it("sets status to unsubscribed and unsubscribedAt", async () => {
      let unsubscribed = false;
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "id", isNew: true }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => {
          unsubscribed = true;
          return Effect.void;
        },
        findByEmail: (_email) =>
          Effect.succeed(makeTestSubscriber({ status: "active" })),
      } satisfies SubscriberService);

      await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.unsubscribe("test@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(unsubscribed).toBe(true);
    });

    it("fails with SubscriberNotFoundError for nonexistent email", async () => {
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "id", isNew: true }),
        verify: (_email) => Effect.void,
        unsubscribe: (email) =>
          Effect.fail(new SubscriberNotFoundError({ email })),
        findByEmail: (_email) => Effect.succeed(null),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.unsubscribe("missing@example.com"),
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

  describe("findByEmail", () => {
    it("returns subscriber when found", async () => {
      const sub = makeTestSubscriber({ email: "found@example.com" });
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "id", isNew: true }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) => Effect.succeed(sub),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.findByEmail("found@example.com")),
          Effect.provide(TestLayer),
        ),
      );

      expect(result).not.toBeNull();
      expect(result?.email).toBe("found@example.com");
    });

    it("returns null when not found", async () => {
      const TestLayer = Layer.succeed(SubscriberServiceTag, {
        subscribe: (_email) => Effect.succeed({ id: "id", isNew: true }),
        verify: (_email) => Effect.void,
        unsubscribe: (_email) => Effect.void,
        findByEmail: (_email) => Effect.succeed(null),
      } satisfies SubscriberService);

      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.findByEmail("missing@example.com"),
          ),
          Effect.provide(TestLayer),
        ),
      );

      expect(result).toBeNull();
    });
  });
});
