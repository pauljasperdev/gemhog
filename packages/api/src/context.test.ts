import { describe, expect, it, vi } from "vitest";

import { createContext } from "./context";

const { getSession } = vi.hoisted(() => {
  return {
    getSession: vi.fn(),
  };
});

vi.mock("@gemhog/core/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

describe("createContext", () => {
  it("returns session from headers", async () => {
    const headers = new Headers({ "x-test": "context" });
    const session = {
      user: {
        id: "user-id",
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: "session-id",
        token: "session-token",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        userId: "user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: null,
        userAgent: null,
      },
    };

    getSession.mockResolvedValue(session);

    const context = await createContext({ headers });

    expect(getSession).toHaveBeenCalledWith({ headers });
    expect(context.session).toEqual(session);
  });
});
