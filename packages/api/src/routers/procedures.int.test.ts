import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

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

import { t } from "../index";
import { appRouter } from "./index";

// Create caller factory (modern tRPC v11 pattern)
const createCaller = t.createCallerFactory(appRouter);

// Mock session shape matching better-auth response
const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: "test-session-id",
    token: "test-token",
    expiresAt: new Date(Date.now() + 86400000), // 24h from now
    userId: "test-user-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  },
};

describe("healthCheck (public)", () => {
  it("should return OK without session", async () => {
    const caller = createCaller({ session: null });

    const result = await caller.healthCheck();

    expect(result).toBe("OK");
  });
});

describe("privateData (protected)", () => {
  it("should return data with valid session", async () => {
    const caller = createCaller({ session: mockSession });

    const result = await caller.privateData();

    expect(result).toEqual({
      message: "This is private",
      user: mockSession.user,
    });
  });

  it("should throw UNAUTHORIZED without session", async () => {
    const caller = createCaller({ session: null });

    await expect(caller.privateData()).rejects.toThrow(TRPCError);
    await expect(caller.privateData()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
