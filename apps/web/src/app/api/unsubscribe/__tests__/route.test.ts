// @vitest-environment node

import { createHmac } from "node:crypto";
import { EmailService } from "@gemhog/email";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

process.env.BETTER_AUTH_SECRET = TEST_SECRET;
process.env.APP_URL = "http://localhost:3001";

vi.mock("@gemhog/core/subscriber", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@gemhog/core/subscriber")>();
  const now = new Date();
  const mockSubscriber = {
    id: "test-id",
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
    SubscriberLayers: Layer.mergeAll(
      Layer.succeed(EmailService, {
        send: () => Effect.void,
      }),
      Layer.succeed(actual.SubscriberService, {
        createSubscriber: () =>
          Effect.succeed({ ...mockSubscriber, status: "pending" }),
        readSubscriberById: () => Effect.succeed(mockSubscriber),
        readSubscriberByEmail: () => Effect.succeed(mockSubscriber),
        updateSubscriberById: () => Effect.succeed(mockSubscriber),
        subscribe: () =>
          Effect.succeed({ ...mockSubscriber, status: "pending" }),
        verify: () => Effect.succeed(mockSubscriber),
        unsubscribe: () => Effect.succeed(mockSubscriber),
      }),
    ),
  };
});

import { POST } from "../route";

function makeTestToken(
  payload: { email: string; action: string; expiresAt: number },
  secret: string,
): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(`${data}.${signature}`).toString("base64url");
}

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for valid unsubscribe token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "unsubscribe",
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      },
      TEST_SECRET,
    );

    const { NextRequest } = await import("next/server");
    const response = await POST(
      new NextRequest(`http://localhost:3001/api/unsubscribe?token=${token}`, {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Unsubscribed successfully");
  });

  it("returns 400 for missing token", async () => {
    const { NextRequest } = await import("next/server");
    const response = await POST(
      new NextRequest("http://localhost:3001/api/unsubscribe", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing token");
  });

  it("returns 400 for tampered token", async () => {
    const { NextRequest } = await import("next/server");
    const response = await POST(
      new NextRequest(
        "http://localhost:3001/api/unsubscribe?token=tampered-token",
        { method: "POST" },
      ),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid or expired link");
  });

  it("returns 400 for expired token", async () => {
    const token = makeTestToken(
      {
        email: "test@example.com",
        action: "unsubscribe",
        expiresAt: Date.now() - 1000,
      },
      TEST_SECRET,
    );

    const { NextRequest } = await import("next/server");
    const response = await POST(
      new NextRequest(`http://localhost:3001/api/unsubscribe?token=${token}`, {
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid or expired link");
  });
});
