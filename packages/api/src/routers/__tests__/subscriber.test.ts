import { Context, Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Track calls for assertions
const subscribeCalls: string[] = [];

vi.mock("@gemhog/env/server", () => ({
  serverEnv: {
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    APP_URL: "http://localhost:3001",
    DATABASE_URL: "postgresql://localhost/test",
    DATABASE_URL_POOLER: "postgresql://localhost/test",
    BETTER_AUTH_URL: "http://localhost:3001",
    GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
    RESEND_API_KEY: "re_test_key",
    SENTRY_DSN: "https://key@sentry.io/123",
  },
  ServerEnvService: Context.GenericTag("ServerEnvService"),
  ServerEnvLive: Layer.empty,
}));

vi.mock("@gemhog/core/drizzle", () => ({
  DatabaseLive: Layer.empty,
}));

vi.mock("@gemhog/core/email", () => {
  const EmailService = Context.GenericTag<{
    send: (params: unknown) => Effect.Effect<void>;
  }>("EmailService");

  const SubscriberService = Context.GenericTag<{
    createSubscriber: (
      email: string,
    ) => Effect.Effect<{ id: string; isNew: boolean }>;
    readSubscriberById: (subscriberId: string) => Effect.Effect<unknown>;
    readSubscriberByEmail: (email: string) => Effect.Effect<unknown>;
    updateSubscriberById: (
      subscriberId: string,
      updates: unknown,
    ) => Effect.Effect<void>;
    subscribe: (email: string) => Effect.Effect<{
      id: string;
      email: string;
      status: string;
      subscribedAt: Date;
      verifiedAt: Date | null;
      unsubscribedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    verify: (subscriberId: string) => Effect.Effect<void>;
    unsubscribe: (subscriberId: string) => Effect.Effect<void>;
  }>("SubscriberService");

  const MockEmailLayer = Layer.succeed(EmailService, {
    send: () => Effect.void,
  });

  const MockSubscriberLayer = Layer.succeed(SubscriberService, {
    createSubscriber: (_email: string) =>
      Effect.succeed({ id: "mock-id", isNew: true }),
    readSubscriberById: (_id: string) => Effect.succeed(null),
    readSubscriberByEmail: (email: string) =>
      Effect.succeed({ id: "mock-id", email, status: "pending" }),
    updateSubscriberById: (_id: string, _updates: unknown) => Effect.void,
    subscribe: (email: string) => {
      subscribeCalls.push(email);
      return Effect.succeed({
        id: "mock-id",
        email,
        status: "pending" as const,
        subscribedAt: new Date(),
        verifiedAt: null,
        unsubscribedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    verify: () => Effect.void,
    unsubscribe: () => Effect.void,
  });

  return {
    EmailService,
    EmailServiceConsole: MockEmailLayer,
    EmailServiceLive: MockEmailLayer,
    SubscriberService,
    EmailLayers: Layer.mergeAll(MockEmailLayer, MockSubscriberLayer),
    SubscriberServiceLive: MockSubscriberLayer,
    createToken: () => Effect.succeed("mock-token"),
    verificationEmail: () => ({
      subject: "Verify",
      html: "<p>Verify</p>",
      text: "Verify",
    }),
  };
});

import { t } from "../../index";
import { appRouter } from "../index";

const createCaller = t.createCallerFactory(appRouter);

describe("subscriberRouter", () => {
  describe("subscribe mutation", () => {
    beforeEach(() => {
      subscribeCalls.length = 0;
    });

    it("should return subscriber object for valid email", async () => {
      const caller = createCaller({ session: null });
      const result = await caller.subscriber.subscribe({
        email: "test@example.com",
      });

      expect(result).toMatchObject({
        id: "mock-id",
        email: "test@example.com",
        status: "pending",
      });
    });

    it("should call subscriberService.subscribe with the email", async () => {
      const caller = createCaller({ session: null });
      await caller.subscriber.subscribe({ email: "user@example.com" });

      expect(subscribeCalls).toContain("user@example.com");
    });

    it("should reject invalid email", async () => {
      const caller = createCaller({ session: null });

      await expect(
        caller.subscriber.subscribe({ email: "not-an-email" }),
      ).rejects.toThrow();
    });
  });
});
