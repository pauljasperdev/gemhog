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

import { GET } from "./route";

const TEST_SECRET = "test-secret";

async function makeToken(
  payload: TokenPayload,
  secret = TEST_SECRET,
): Promise<string> {
  return Effect.runPromise(createToken(payload, secret));
}

describe("GET /api/verify", () => {
  beforeEach(() => {
    vi.stubEnv("SUBSCRIBER_TOKEN_SECRET", TEST_SECRET);
    vi.stubEnv("APP_URL", "http://localhost:3001");
  });

  it("redirects to /verify?status=success for valid token", async () => {
    const token = await makeToken({
      email: "test@example.com",
      action: "verify",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const response = await GET(
      new (await import("next/server")).NextRequest(
        `http://localhost:3001/api/verify?token=${token}`,
      ),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/verify?status=success");
  });

  it("redirects to /verify?status=expired for expired token", async () => {
    const token = await makeToken({
      email: "test@example.com",
      action: "verify",
      expiresAt: Date.now() - 1000,
    });

    const response = await GET(
      new (await import("next/server")).NextRequest(
        `http://localhost:3001/api/verify?token=${token}`,
      ),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/verify?status=expired");
  });

  it("returns 400 for missing token", async () => {
    const response = await GET(
      new (await import("next/server")).NextRequest(
        "http://localhost:3001/api/verify",
      ),
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing token");
  });

  it("redirects to /verify?status=invalid for tampered token", async () => {
    const response = await GET(
      new (await import("next/server")).NextRequest(
        "http://localhost:3001/api/verify?token=tampered-token",
      ),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/verify?status=invalid");
  });
});
