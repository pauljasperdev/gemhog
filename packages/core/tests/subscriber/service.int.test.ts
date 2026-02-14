import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import { EmailServiceConsole } from "@gemhog/email";
import * as Effect from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { SubscriberNotFoundError } from "../../src/subscriber/errors";
import { SubscriberRepository } from "../../src/subscriber/repository";
import { SubscriberRepositoryLive } from "../../src/subscriber/repository.live";
import { SubscriberService } from "../../src/subscriber/service";
import { SubscriberServiceLive } from "../../src/subscriber/service.live";
import { subscriber } from "../../src/subscriber/sql";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/gemhog";

process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters-long";
process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3001";

const TestPgLive = PgClient.layer({ url: Effect.Redacted.make(DATABASE_URL) });
const TestDrizzleLive = PgDrizzle.layer.pipe(Effect.Layer.provide(TestPgLive));
const TestRepositoryLive = SubscriberRepositoryLive.pipe(
  Effect.Layer.provide(TestDrizzleLive),
);
const TestSubscriberLive = SubscriberServiceLive.pipe(
  Effect.Layer.provide(TestRepositoryLive),
  Effect.Layer.provide(EmailServiceConsole),
);

const truncate = Effect.Effect.gen(function* () {
  const db = yield* PgDrizzle.PgDrizzle;
  yield* db
    .delete(subscriber)
    .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed(undefined)));
});

const runWithService = <A, E>(
  effect: Effect.Effect.Effect<A, E, SubscriberService>,
) =>
  Effect.Effect.runPromise(
    effect.pipe(Effect.Effect.provide(TestSubscriberLive)),
  );

const runWithRepository = <A, E>(
  effect: Effect.Effect.Effect<A, E, SubscriberRepository>,
) =>
  Effect.Effect.runPromise(
    effect.pipe(Effect.Effect.provide(TestRepositoryLive)),
  );

const runTruncate = () =>
  Effect.Effect.runPromise(
    truncate.pipe(Effect.Effect.provide(TestDrizzleLive)),
  );

describe("subscriber service integration", () => {
  afterEach(async () => {
    await runTruncate();
  });

  describe("subscribe", () => {
    it("creates a new subscriber with pending status", async () => {
      const result = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("new@example.com"),
          ),
        ),
      );

      expect(result.id).toBeTruthy();
      expect(result.status).toBe("pending");
      expect(result.email).toBe("new@example.com");
    });

    it("returns existing subscriber for duplicate pending email", async () => {
      const first = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("dup@example.com"),
          ),
        ),
      );

      const result = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("dup@example.com"),
          ),
        ),
      );

      expect(result.id).toBe(first.id);
      expect(result.status).toBe("pending");
    });

    it("returns existing subscriber for duplicate active email (silent success)", async () => {
      await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service
              .subscribe("active@example.com")
              .pipe(Effect.Effect.flatMap((sub) => service.verify(sub.id))),
          ),
        ),
      );

      const result = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("active@example.com"),
          ),
        ),
      );

      expect(result.status).toBe("active");
    });
  });

  describe("full subscribe -> verify lifecycle", () => {
    it("transitions from pending to active", async () => {
      await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service
              .subscribe("lifecycle@example.com")
              .pipe(Effect.Effect.flatMap((sub) => service.verify(sub.id))),
          ),
        ),
      );

      const found = await runWithRepository(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repository) =>
            repository.readSubscriberByEmail("lifecycle@example.com"),
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
          Effect.Effect.flatMap((service) =>
            service
              .subscribe("full@example.com")
              .pipe(
                Effect.Effect.flatMap((sub) =>
                  service
                    .verify(sub.id)
                    .pipe(
                      Effect.Effect.flatMap(() => service.unsubscribe(sub.id)),
                    ),
                ),
              ),
          ),
        ),
      );

      const found = await runWithRepository(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repository) =>
            repository.readSubscriberByEmail("full@example.com"),
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
          Effect.Effect.flatMap((service) =>
            service
              .subscribe("resub@example.com")
              .pipe(
                Effect.Effect.flatMap((sub) =>
                  service
                    .verify(sub.id)
                    .pipe(
                      Effect.Effect.flatMap(() => service.unsubscribe(sub.id)),
                    ),
                ),
              ),
          ),
        ),
      );

      // Re-subscribe
      const result = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("resub@example.com"),
          ),
        ),
      );

      expect(result.status).toBe("pending");

      const found = await runWithRepository(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repository) =>
            repository.readSubscriberByEmail("resub@example.com"),
          ),
        ),
      );

      expect(found?.status).toBe("pending");
      expect(found?.unsubscribedAt).toBeNull();
    });
  });

  describe("verify", () => {
    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const result = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("nonexistent-id")),
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
    it("fails with SubscriberNotFoundError for nonexistent id", async () => {
      const result = await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.unsubscribe("nonexistent-id"),
          ),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
      }
    });
  });

  describe("readSubscriberByEmail", () => {
    it("fails with SubscriberNotFoundError for nonexistent email", async () => {
      const result = await runWithRepository(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repository) =>
            repository.readSubscriberByEmail("nobody@example.com"),
          ),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
      }
    });

    it("returns subscriber when found", async () => {
      await runWithService(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("find@example.com"),
          ),
        ),
      );

      const result = await runWithRepository(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repository) =>
            repository.readSubscriberByEmail("find@example.com"),
          ),
        ),
      );

      expect(result).not.toBeNull();
      expect(result?.email).toBe("find@example.com");
    });
  });
});
