import { createHmac } from "node:crypto";
import { Context, Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

process.env.BETTER_AUTH_SECRET = TEST_SECRET;
process.env.APP_URL = "http://localhost:3001";

vi.mock("@gemhog/core/drizzle", () => ({
  DatabaseLive: Layer.empty,
}));

vi.mock("@/lib/email-layers", () => {
  // biome-ignore lint/suspicious/noExplicitAny: vi.mock factory cannot reference real types
  const SubscriberService = Context.GenericTag<any>("SubscriberService");
  // biome-ignore lint/suspicious/noExplicitAny: vi.mock factory cannot reference real types
  const EmailService = Context.GenericTag<any>("EmailService");
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
