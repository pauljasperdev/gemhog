import { createHmac } from "node:crypto";
import { EmailService } from "@gemhog/email";
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

process.env.BETTER_AUTH_SECRET = TEST_SECRET;
process.env.APP_URL = "http://localhost:3001";

vi.mock("@gemhog/core/drizzle", () => ({
  DatabaseLive: Layer.empty,
}));

vi.mock("@gemhog/core/subscriber", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@gemhog/core/subscriber")>();
  const now = new Date();
  const mockSubscriber = {
    id: "mock-id",
    email: "test@example.com",
    status: "pending" as const,
    subscribedAt: now,
    verifiedAt: null,
    unsubscribedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...actual,
    SubscriberLayers: Layer.mergeAll(
      Layer.succeed(actual.SubscriberService, {
        createSubscriber: () => Effect.succeed(mockSubscriber),
        readSubscriberById: () => Effect.succeed(mockSubscriber),
        readSubscriberByEmail: () => Effect.succeed(mockSubscriber),
        updateSubscriberById: () => Effect.succeed(mockSubscriber),
        subscribe: () => Effect.succeed(mockSubscriber),
        verify: () => Effect.succeed(mockSubscriber),
        unsubscribe: () => Effect.succeed(mockSubscriber),
      }),
      Layer.succeed(EmailService, {
        send: () => Effect.void,
      }),
    ),
  };
});

import { getVerifyStatus } from "../verify-status";

function makeTestToken(
  payload: { email: string; action: string; expiresAt: number },
  secret: string,
): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(`${data}.${signature}`).toString("base64url");
}

describe("getVerifyStatus", () => {
  it("should return 'success' for valid token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "verify",
        expiresAt: Date.now() + 60000,
      },
      TEST_SECRET,
    );

    const status = await getVerifyStatus(token);
    expect(status).toBe("success");
  });

  it("should return 'expired' for expired token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "verify",
        expiresAt: Date.now() - 60000,
      },
      TEST_SECRET,
    );

    const status = await getVerifyStatus(token);
    expect(status).toBe("expired");
  });

  it("should return 'invalid' for malformed token", async () => {
    const status = await getVerifyStatus("not-a-valid-token");
    expect(status).toBe("invalid");
  });

  it("should return 'invalid' for wrong signature token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "verify",
        expiresAt: Date.now() + 60000,
      },
      "completely-different-secret-key-here",
    );

    const status = await getVerifyStatus(token);
    expect(status).toBe("invalid");
  });
});
