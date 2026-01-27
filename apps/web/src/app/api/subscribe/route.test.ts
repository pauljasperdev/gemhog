// @vitest-environment node

import { EmailServiceTag, SubscriberServiceTag } from "@gemhog/core/email";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email-layers", () => ({
  EmailLayers: Layer.mergeAll(
    Layer.succeed(EmailServiceTag, {
      send: () => Effect.void,
    }),
    Layer.succeed(SubscriberServiceTag, {
      subscribe: () => Effect.succeed({ id: "test-id", isNew: true }),
      verify: () => Effect.void,
      unsubscribe: () => Effect.void,
      findByEmail: () =>
        Effect.succeed({
          id: "test-id",
          email: "test@example.com",
          status: "pending" as const,
          subscribedAt: new Date(),
          verifiedAt: null,
          unsubscribedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    }),
  ),
}));

import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3001/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    vi.stubEnv("SUBSCRIBER_TOKEN_SECRET", "test-secret");
    vi.stubEnv("APP_URL", "http://localhost:3001");
  });

  it("returns 200 for valid email", async () => {
    const response = await POST(makeRequest({ email: "test@example.com" }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Check your email to confirm your subscription");
  });

  it("returns 400 for invalid email", async () => {
    const response = await POST(makeRequest({ email: "not-an-email" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid email address");
  });

  it("returns 400 for missing body", async () => {
    const response = await POST(
      new Request("http://localhost:3001/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      }),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid email address");
  });

  it("returns 400 for empty object", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid email address");
  });

  it("returns same 200 message for duplicate email (privacy-safe)", async () => {
    const response = await POST(makeRequest({ email: "existing@example.com" }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Check your email to confirm your subscription");
  });
});
