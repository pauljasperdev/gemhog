import { createHmac } from "node:crypto";
import { EmailService } from "@gemhog/email";
import * as Effect from "effect";
import { describe, expect, it, vi } from "vitest";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

process.env.BETTER_AUTH_SECRET = TEST_SECRET;
process.env.APP_URL = "http://localhost:3001";

vi.mock("@gemhog/db", () => ({
  SqlLive: Effect.Layer.empty,
}));

vi.mock("@gemhog/subscriber", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@gemhog/subscriber")>();
  const now = new Date();
  const mockSubscriber = {
    id: "mock-id",
    email: "test@example.com",
    status: "active" as const,
    subscribedAt: now,
    verifiedAt: null,
    unsubscribedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...actual,
    SubscriberLayers: Effect.Layer.mergeAll(
      Effect.Layer.succeed(actual.SubscriberRepository, {
        createSubscriber: () =>
          Effect.Effect.succeed({ ...mockSubscriber, status: "pending" }),
        readSubscriberById: () => Effect.Effect.succeed(mockSubscriber),
        readSubscriberByEmail: () => Effect.Effect.succeed(mockSubscriber),
        updateSubscriberById: () => Effect.Effect.succeed(mockSubscriber),
      }),
      Effect.Layer.succeed(actual.SubscriberService, {
        subscribe: () => Effect.Effect.succeed(mockSubscriber),
        verify: () => Effect.Effect.void,
        unsubscribe: () => Effect.Effect.void,
      }),
      Effect.Layer.succeed(EmailService, {
        send: () => Effect.Effect.succeed(undefined),
      }),
    ),
  };
});

import { getUnsubscribeStatus } from "../../../src/app/unsubscribe/unsubscribe-status";

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
