import { createHmac } from "node:crypto";
import { Context, Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

vi.mock("@gemhog/env/server", () => ({
  serverEnv: {
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    APP_URL: "http://localhost:3001",
    DATABASE_URL: "postgresql://localhost/test",
    DATABASE_URL_POOLER: "postgresql://localhost/test",
    BETTER_AUTH_URL: "http://localhost:3001",
    GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
    SENTRY_DSN: "https://key@sentry.io/123",
  },
}));

const TEST_SECRET = "test-secret-at-least-32-characters-long";

vi.mock("@gemhog/core/drizzle", () => ({
  DatabaseLive: Layer.empty,
}));

vi.mock("@/lib/email-layers", () => {
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
    subscribe: (email: string) => Effect.Effect<unknown>;
    verify: (subscriberId: string) => Effect.Effect<void>;
    unsubscribe: (subscriberId: string) => Effect.Effect<void>;
  }>("SubscriberService");

  const EmailService = Context.GenericTag<{
    send: (params: unknown) => Effect.Effect<void>;
  }>("EmailService");

  return {
    EmailLayers: Layer.mergeAll(
      Layer.succeed(SubscriberService, {
        createSubscriber: () => Effect.succeed({ id: "mock-id", isNew: true }),
        readSubscriberById: () => Effect.succeed(null),
        readSubscriberByEmail: () =>
          Effect.succeed({
            id: "mock-id",
            email: "test@example.com",
            status: "active",
          }),
        updateSubscriberById: () => Effect.void,
        subscribe: () => Effect.succeed({ id: "mock-id" }),
        verify: () => Effect.void,
        unsubscribe: () => Effect.void,
      }),
      Layer.succeed(EmailService, {
        send: () => Effect.void,
      }),
    ),
  };
});

import { getUnsubscribeStatus } from "../unsubscribe-status";

function makeTestToken(
  payload: { email: string; action: string; expiresAt: number },
  secret: string,
): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(`${data}.${signature}`).toString("base64url");
}

describe("getUnsubscribeStatus", () => {
  it("should return 'success' for valid unsubscribe token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "unsubscribe",
        expiresAt: Date.now() + 60000,
      },
      TEST_SECRET,
    );

    const status = await getUnsubscribeStatus(token);
    expect(status).toBe("success");
  });

  it("should return 'invalid' for expired token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "unsubscribe",
        expiresAt: Date.now() - 60000,
      },
      TEST_SECRET,
    );

    const status = await getUnsubscribeStatus(token);
    expect(status).toBe("invalid");
  });

  it("should return 'invalid' for malformed token", async () => {
    const status = await getUnsubscribeStatus("garbage-token");
    expect(status).toBe("invalid");
  });

  it("should return 'invalid' for wrong signature token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "unsubscribe",
        expiresAt: Date.now() + 60000,
      },
      "completely-different-secret-key-here",
    );

    const status = await getUnsubscribeStatus(token);
    expect(status).toBe("invalid");
  });
});
