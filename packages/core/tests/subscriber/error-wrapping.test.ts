import { EmailService } from "@gemhog/email";
import * as Effect from "effect";
import { describe, expect, it } from "vitest";
import {
  SubscriberNotFoundError,
  SubscriberRepositoryError,
  SubscriberServiceError,
} from "../../src/subscriber/errors";
import { SubscriberRepository } from "../../src/subscriber/repository";
import { SubscriberService } from "../../src/subscriber/service";
import { SubscriberServiceLive } from "../../src/subscriber/service.live";
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

describe("SubscriberRepository Error Wrapping", () => {
  describe("createSubscriber", () => {
    it("wraps SqlError in SubscriberRepositoryError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Database connection failed"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) => Effect.Effect.fail(repoError),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.createSubscriber("test@example.com"),
          ),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberRepositoryError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(Error);
      }
    });
  });

  describe("readSubscriberById", () => {
    it("wraps SqlError in SubscriberRepositoryError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Query timeout"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) => Effect.Effect.fail(repoError),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readSubscriberById("test-id")),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberRepositoryError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(Error);
      }
    });

    it("does NOT wrap SubscriberNotFoundError", async () => {
      const notFoundError = new SubscriberNotFoundError({
        identifier: "id:missing-id",
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) => Effect.Effect.fail(notFoundError),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readSubscriberById("missing-id"),
          ),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
        expect(result.left).not.toBeInstanceOf(SubscriberRepositoryError);
      }
    });
  });

  describe("readSubscriberByEmail", () => {
    it("wraps SqlError in SubscriberRepositoryError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Table does not exist"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) => Effect.Effect.fail(repoError),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readSubscriberByEmail("test@example.com"),
          ),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberRepositoryError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(Error);
      }
    });

    it("does NOT wrap SubscriberNotFoundError", async () => {
      const notFoundError = new SubscriberNotFoundError({
        identifier: "email:missing@example.com",
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) => Effect.Effect.fail(notFoundError),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readSubscriberByEmail("missing@example.com"),
          ),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
        expect(result.left).not.toBeInstanceOf(SubscriberRepositoryError);
      }
    });
  });

  describe("updateSubscriberById", () => {
    it("wraps SqlError in SubscriberRepositoryError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Constraint violation"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) => Effect.Effect.fail(repoError),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.updateSubscriberById("test-id", { status: "active" }),
          ),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberRepositoryError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(Error);
      }
    });

    it("does NOT wrap SubscriberNotFoundError", async () => {
      const notFoundError = new SubscriberNotFoundError({
        identifier: "id:missing-id",
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.fail(notFoundError),
      });

      const result = await Effect.Effect.runPromise(
        SubscriberRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.updateSubscriberById("missing-id", { status: "active" }),
          ),
          Effect.Effect.provide(TestRepoLayer),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
        expect(result.left).not.toBeInstanceOf(SubscriberRepositoryError);
      }
    });
  });
});

describe("SubscriberService Error Wrapping", () => {
  // Set required environment variables for config
  process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3000";
  process.env.BETTER_AUTH_SECRET =
    process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters-long";

  describe("subscribe", () => {
    it("wraps SubscriberRepositoryError in SubscriberServiceError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Database unavailable"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) => Effect.Effect.fail(repoError),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const TestEmailLayer = Effect.Layer.succeed(EmailService, {
        send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
      });

      const TestLayers = SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      );

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) =>
            service.subscribe("test@example.com"),
          ),
          Effect.Effect.provide(TestLayers),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberServiceError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(SubscriberRepositoryError);
      }
    });
  });

  describe("verify", () => {
    it("wraps SubscriberRepositoryError in SubscriberServiceError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Update failed"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) => Effect.Effect.fail(repoError),
      });

      const TestEmailLayer = Effect.Layer.succeed(EmailService, {
        send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
      });

      const TestLayers = SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      );

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("test-id")),
          Effect.Effect.provide(TestLayers),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberServiceError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(SubscriberRepositoryError);
      }
    });

    it("does NOT wrap SubscriberNotFoundError", async () => {
      const notFoundError = new SubscriberNotFoundError({
        identifier: "id:missing-id",
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) => Effect.Effect.fail(notFoundError),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const TestEmailLayer = Effect.Layer.succeed(EmailService, {
        send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
      });

      const TestLayers = SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      );

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("missing-id")),
          Effect.Effect.provide(TestLayers),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
        expect(result.left).not.toBeInstanceOf(SubscriberServiceError);
      }
    });
  });

  describe("unsubscribe", () => {
    it("wraps SubscriberRepositoryError in SubscriberServiceError", async () => {
      const repoError = new SubscriberRepositoryError({
        cause: new Error("Update failed"),
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) => Effect.Effect.fail(repoError),
      });

      const TestEmailLayer = Effect.Layer.succeed(EmailService, {
        send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
      });

      const TestLayers = SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      );

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("test-id")),
          Effect.Effect.provide(TestLayers),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberServiceError);
        expect(
          (result.left as unknown as { cause: unknown }).cause,
        ).toBeInstanceOf(SubscriberRepositoryError);
      }
    });

    it("does NOT wrap SubscriberNotFoundError", async () => {
      const notFoundError = new SubscriberNotFoundError({
        identifier: "id:missing-id",
      });

      const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
        createSubscriber: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        readSubscriberById: (_id) => Effect.Effect.fail(notFoundError),
        readSubscriberByEmail: (_email) =>
          Effect.Effect.succeed(makeTestSubscriber()),
        updateSubscriberById: (_id, _updates) =>
          Effect.Effect.succeed(makeTestSubscriber()),
      });

      const TestEmailLayer = Effect.Layer.succeed(EmailService, {
        send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
      });

      const TestLayers = SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      );

      const result = await Effect.Effect.runPromise(
        SubscriberService.pipe(
          Effect.Effect.flatMap((service) => service.verify("missing-id")),
          Effect.Effect.provide(TestLayers),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(SubscriberNotFoundError);
        expect(result.left).not.toBeInstanceOf(SubscriberServiceError);
      }
    });
  });
});
