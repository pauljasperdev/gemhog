// @vitest-environment node

import type { TokenPayload } from "@gemhog/core/email";
import {
  createToken,
  EmailServiceTag,
  SubscriberServiceTag,
} from "@gemhog/core/email";
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
      findByEmail: () => Effect.succeed(null),
    }),
  ),
}));

import { GET, POST } from "./route";

const TEST_SECRET = "test-secret";

async function makeToken(
  payload: TokenPayload,
  secret = TEST_SECRET,
): Promise<string> {
  return Effect.runPromise(createToken(payload, secret));
}

function makeNextRequest(url: string): import("next/server").NextRequest {
  // NextRequest requires the full URL
  const { NextRequest } = require("next/server");
  return new NextRequest(url);
}

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    vi.stubEnv("SUBSCRIBER_TOKEN_SECRET", TEST_SECRET);
    vi.stubEnv("APP_URL", "http://localhost:3001");
  });

  it("returns 200 for valid token", async () => {
    const token = await makeToken({
      email: "test@example.com",
      action: "unsubscribe",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    const response = await POST(
      makeNextRequest(`http://localhost:3001/api/unsubscribe?token=${token}`),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Unsubscribed successfully");
  });

  it("returns 400 for invalid token", async () => {
    const response = await POST(
      makeNextRequest("http://localhost:3001/api/unsubscribe?token=bad-token"),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid or expired link");
  });

  it("returns 400 for missing token", async () => {
    const response = await POST(
      makeNextRequest("http://localhost:3001/api/unsubscribe"),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing token");
  });
});

describe("GET /api/unsubscribe", () => {
  beforeEach(() => {
    vi.stubEnv("SUBSCRIBER_TOKEN_SECRET", TEST_SECRET);
    vi.stubEnv("APP_URL", "http://localhost:3001");
  });

  it("redirects to /unsubscribe?status=success for valid token", async () => {
    const token = await makeToken({
      email: "test@example.com",
      action: "unsubscribe",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    const response = await GET(
      makeNextRequest(`http://localhost:3001/api/unsubscribe?token=${token}`),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/unsubscribe?status=success");
  });

  it("redirects to /unsubscribe?status=invalid for invalid token", async () => {
    const response = await GET(
      makeNextRequest("http://localhost:3001/api/unsubscribe?token=bad-token"),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/unsubscribe?status=invalid");
  });

  it("redirects to /unsubscribe?status=invalid for missing token", async () => {
    const response = await GET(
      makeNextRequest("http://localhost:3001/api/unsubscribe"),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/unsubscribe?status=invalid");
  });
});
