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

import { POST } from "./route";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

async function makeToken(
  payload: TokenPayload,
  secret = TEST_SECRET,
): Promise<string> {
  return Effect.runPromise(createToken(payload, secret));
}

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for valid unsubscribe token", async () => {
    const token = await makeToken({
      email: "test@example.com",
      action: "unsubscribe",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

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
    const token = await makeToken({
      email: "test@example.com",
      action: "unsubscribe",
      expiresAt: Date.now() - 1000,
    });

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
