import { Context, Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Track calls for assertions
const sendCalls: unknown[] = [];
const subscribeCalls: string[] = [];

vi.mock("@gemhog/env/server", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    APP_URL: "http://localhost:3001",
    DATABASE_URL: "postgresql://localhost/test",
    DATABASE_URL_POOLER: "postgresql://localhost/test",
    BETTER_AUTH_URL: "http://localhost:3001",
    GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
  },
}));

vi.mock("@gemhog/core/drizzle", () => ({
  DatabaseLive: Layer.empty,
}));

vi.mock("@gemhog/core/email", () => {
  const EmailServiceTag = Context.GenericTag<{
    send: (params: unknown) => Effect.Effect<void>;
  }>("EmailService");

  const SubscriberServiceTag = Context.GenericTag<{
    subscribe: (email: string) => Effect.Effect<{ id: string; isNew: boolean }>;
    verify: (email: string) => Effect.Effect<void>;
    unsubscribe: (email: string) => Effect.Effect<void>;
    findByEmail: (email: string) => Effect.Effect<unknown>;
  }>("SubscriberService");

  const MockEmailLayer = Layer.succeed(EmailServiceTag, {
    send: (params: unknown) => {
      sendCalls.push(params);
      return Effect.void;
    },
  });

  const MockSubscriberLayer = Layer.succeed(SubscriberServiceTag, {
    subscribe: (email: string) => {
      subscribeCalls.push(email);
      return Effect.succeed({ id: "mock-id", isNew: true });
    },
    verify: () => Effect.void,
    unsubscribe: () => Effect.void,
    findByEmail: (email: string) =>
      Effect.succeed({ id: "mock-id", email, status: "pending" }),
  });

  return {
    EmailServiceTag,
    SubscriberServiceTag,
    EmailServiceConsole: MockEmailLayer,
    makeEmailServiceLive: () => MockEmailLayer,
    SubscriberServiceLive: MockSubscriberLayer,
    createToken: () => Effect.succeed("mock-token"),
    verificationEmail: () => ({ subject: "Verify", html: "<p>Verify</p>" }),
  };
});

import { t } from "../index";
import { appRouter } from "./index";

const createCaller = t.createCallerFactory(appRouter);

describe("subscriberRouter", () => {
  describe("subscribe mutation", () => {
    beforeEach(() => {
      sendCalls.length = 0;
      subscribeCalls.length = 0;
    });

    it("should return success message for valid email", async () => {
      const caller = createCaller({ session: null });
      const result = await caller.subscriber.subscribe({
        email: "test@example.com",
      });

      expect(result).toEqual({
        message: "Check your email to confirm your subscription",
      });
    });

    it("should call subscriberService.subscribe with the email", async () => {
      const caller = createCaller({ session: null });
      await caller.subscriber.subscribe({ email: "user@example.com" });

      expect(subscribeCalls).toContain("user@example.com");
    });

    it("should send verification email for new subscriber", async () => {
      const caller = createCaller({ session: null });
      await caller.subscriber.subscribe({ email: "new@example.com" });

      expect(sendCalls.length).toBeGreaterThan(0);
      expect(sendCalls[0]).toMatchObject({
        to: "new@example.com",
        subject: "Verify",
      });
    });

    it("should reject invalid email", async () => {
      const caller = createCaller({ session: null });

      await expect(
        caller.subscriber.subscribe({ email: "not-an-email" }),
      ).rejects.toThrow();
    });
  });
});
