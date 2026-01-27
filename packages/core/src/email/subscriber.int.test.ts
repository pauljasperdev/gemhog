import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { Effect, Layer, Redacted } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { SubscriberNotFoundError } from "./email.errors";
import {
  SubscriberServiceLive,
  SubscriberServiceTag,
} from "./subscriber.service";
import { subscriber } from "./subscriber.sql";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/gemhog";

const TestPgLive = PgClient.layer({ url: Redacted.make(DATABASE_URL) });
const TestDrizzleLive = PgDrizzle.layer.pipe(Layer.provide(TestPgLive));
const TestSubscriberLive = SubscriberServiceLive.pipe(
  Layer.provide(TestDrizzleLive),
);

const truncate = Effect.gen(function* () {
  const db = yield* PgDrizzle.PgDrizzle;
  yield* db.delete(subscriber).pipe(Effect.catchAll(() => Effect.void));
});

const runWithService = <A, E>(
  effect: Effect.Effect<A, E, SubscriberServiceTag>,
) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(TestSubscriberLive),
      Effect.provide(TestDrizzleLive),
    ),
  );

const runTruncate = () =>
  Effect.runPromise(truncate.pipe(Effect.provide(TestDrizzleLive)));

describe("subscriber service integration", () => {
  afterEach(async () => {
    await runTruncate();
  });

  describe("subscribe", () => {
    it("creates a new subscriber with pending status", async () => {
      const result = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("new@example.com")),
        ),
      );

      expect(result.isNew).toBe(true);
      expect(result.id).toBeTruthy();

      // Verify in DB
      const found = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.findByEmail("new@example.com")),
        ),
      );
      expect(found).not.toBeNull();
      expect(found?.status).toBe("pending");
      expect(found?.email).toBe("new@example.com");
    });

    it("returns isNew: false for duplicate pending email", async () => {
      await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("dup@example.com")),
        ),
      );

      const result = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("dup@example.com")),
        ),
      );

      expect(result.isNew).toBe(false);
    });

    it("returns isNew: false for duplicate active email (silent success)", async () => {
      await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service
              .subscribe("active@example.com")
              .pipe(Effect.flatMap(() => service.verify("active@example.com"))),
          ),
        ),
      );

      const result = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("active@example.com")),
        ),
      );

      expect(result.isNew).toBe(false);
    });
  });

  describe("full subscribe -> verify lifecycle", () => {
    it("transitions from pending to active", async () => {
      await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service
              .subscribe("lifecycle@example.com")
              .pipe(
                Effect.flatMap(() => service.verify("lifecycle@example.com")),
              ),
          ),
        ),
      );

      const found = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.findByEmail("lifecycle@example.com"),
          ),
        ),
      );

      expect(found).not.toBeNull();
      expect(found?.status).toBe("active");
      expect(found?.verifiedAt).not.toBeNull();
    });
  });

  describe("full subscribe -> verify -> unsubscribe lifecycle", () => {
    it("transitions through all states", async () => {
      await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.subscribe("full@example.com").pipe(
              Effect.flatMap(() => service.verify("full@example.com")),
              Effect.flatMap(() => service.unsubscribe("full@example.com")),
            ),
          ),
        ),
      );

      const found = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.findByEmail("full@example.com")),
        ),
      );

      expect(found).not.toBeNull();
      expect(found?.status).toBe("unsubscribed");
      expect(found?.unsubscribedAt).not.toBeNull();
      expect(found?.verifiedAt).not.toBeNull();
    });
  });

  describe("re-subscribe after unsubscribe", () => {
    it("resets to pending with isNew: true", async () => {
      // Subscribe -> verify -> unsubscribe
      await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.subscribe("resub@example.com").pipe(
              Effect.flatMap(() => service.verify("resub@example.com")),
              Effect.flatMap(() => service.unsubscribe("resub@example.com")),
            ),
          ),
        ),
      );

      // Re-subscribe
      const result = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("resub@example.com")),
        ),
      );

      expect(result.isNew).toBe(true);

      const found = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.findByEmail("resub@example.com")),
        ),
      );

      expect(found?.status).toBe("pending");
      expect(found?.unsubscribedAt).toBeNull();
    });
  });

  describe("verify", () => {
    it("fails with SubscriberNotFoundError for nonexistent email", async () => {
      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.verify("nonexistent@example.com"),
          ),
          Effect.provide(TestSubscriberLive),
          Effect.provide(TestDrizzleLive),
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
    it("fails with SubscriberNotFoundError for nonexistent email", async () => {
      const result = await Effect.runPromise(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.unsubscribe("nonexistent@example.com"),
          ),
          Effect.provide(TestSubscriberLive),
          Effect.provide(TestDrizzleLive),
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
    it("returns null for nonexistent email", async () => {
      const result = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) =>
            service.findByEmail("nobody@example.com"),
          ),
        ),
      );

      expect(result).toBeNull();
    });

    it("returns subscriber when found", async () => {
      await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.subscribe("find@example.com")),
        ),
      );

      const result = await runWithService(
        SubscriberServiceTag.pipe(
          Effect.flatMap((service) => service.findByEmail("find@example.com")),
        ),
      );

      expect(result).not.toBeNull();
      expect(result?.email).toBe("find@example.com");
    });
  });
});
