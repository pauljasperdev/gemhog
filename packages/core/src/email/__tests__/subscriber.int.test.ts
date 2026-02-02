import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { Effect, Layer, Redacted } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { SubscriberNotFoundError } from "../email.errors";
import { EmailServiceConsole } from "../email.service";
import {
  makeSubscriberServiceLive,
  SubscriberService,
} from "../subscriber.service";
import { subscriber } from "../subscriber.sql";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/gemhog";

const TestPgLive = PgClient.layer({ url: Redacted.make(DATABASE_URL) });
const TestDrizzleLive = PgDrizzle.layer.pipe(Layer.provide(TestPgLive));
const TestSubscriberLive = makeSubscriberServiceLive({
  secret: "test-secret-at-least-32-characters-long",
  appUrl: "http://localhost:3001",
}).pipe(Layer.provide(TestDrizzleLive), Layer.provide(EmailServiceConsole));

const truncate = Effect.gen(function* () {
  const db = yield* PgDrizzle.PgDrizzle;
  yield* db.delete(subscriber).pipe(Effect.catchAll(() => Effect.void));
});

const runWithService = <A, E>(effect: Effect.Effect<A, E, SubscriberService>) =>
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
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("new@example.com")),
        ),
      );

      expect(result.id).toBeTruthy();
      expect(result.status).toBe("pending");
      expect(result.email).toBe("new@example.com");
    });

    it("returns existing subscriber for duplicate pending email", async () => {
      const first = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("dup@example.com")),
        ),
      );

      const result = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("dup@example.com")),
        ),
      );

      expect(result.id).toBe(first.id);
      expect(result.status).toBe("pending");
    });

    it("returns existing subscriber for duplicate active email (silent success)", async () => {
      await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service
              .subscribe("active@example.com")
              .pipe(Effect.flatMap((sub) => service.verify(sub.id))),
          ),
        ),
      );

      const result = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("active@example.com")),
        ),
      );

      expect(result.status).toBe("active");
    });
  });

  describe("full subscribe -> verify lifecycle", () => {
    it("transitions from pending to active", async () => {
      await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service
              .subscribe("lifecycle@example.com")
              .pipe(Effect.flatMap((sub) => service.verify(sub.id))),
          ),
        ),
      );

      const found = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("lifecycle@example.com"),
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
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service
              .subscribe("full@example.com")
              .pipe(
                Effect.flatMap((sub) =>
                  service
                    .verify(sub.id)
                    .pipe(Effect.flatMap(() => service.unsubscribe(sub.id))),
                ),
              ),
          ),
        ),
      );

      const found = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("full@example.com"),
          ),
        ),
      );

      expect(found).not.toBeNull();
      expect(found?.status).toBe("unsubscribed");
      expect(found?.unsubscribedAt).not.toBeNull();
      expect(found?.verifiedAt).not.toBeNull();
    });
  });

  describe("re-subscribe after unsubscribe", () => {
    it("resets to pending", async () => {
      // Subscribe -> verify -> unsubscribe
      await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service
              .subscribe("resub@example.com")
              .pipe(
                Effect.flatMap((sub) =>
                  service
                    .verify(sub.id)
                    .pipe(Effect.flatMap(() => service.unsubscribe(sub.id))),
                ),
              ),
          ),
        ),
      );

      // Re-subscribe
      const result = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("resub@example.com")),
        ),
      );

      expect(result.status).toBe("pending");

      const found = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("resub@example.com"),
          ),
        ),
      );

      expect(found?.status).toBe("pending");
      expect(found?.unsubscribedAt).toBeNull();
    });
  });

  describe("verify", () => {
    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.verify("nonexistent-id")),
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
    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const result = await Effect.runPromise(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.unsubscribe("nonexistent-id")),
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

  describe("readSubscriberByEmail", () => {
    it("returns null for nonexistent email", async () => {
      const result = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("nobody@example.com"),
          ),
        ),
      );

      expect(result).toBeNull();
    });

    it("returns subscriber when found", async () => {
      await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) => service.subscribe("find@example.com")),
        ),
      );

      const result = await runWithService(
        SubscriberService.pipe(
          Effect.flatMap((service) =>
            service.readSubscriberByEmail("find@example.com"),
          ),
        ),
      );

      expect(result).not.toBeNull();
      expect(result?.email).toBe("find@example.com");
    });
  });
});
