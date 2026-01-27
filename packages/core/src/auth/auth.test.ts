import { describe, expect, it, vi } from "vitest";

vi.mock("@gemhog/env/server", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    DATABASE_URL_POOLER: "postgresql://test:test@localhost:5432/test",
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    BETTER_AUTH_URL: "http://localhost:3000",
    APP_URL: "http://localhost:3001",
    GOOGLE_GENERATIVE_AI_API_KEY: "test-google-api-key",
    NODE_ENV: "test",
  },
}));

import { auth, getSession } from "./auth.service";

describe("auth", () => {
  describe("auth", () => {
    it("should be an object", () => {
      expect(typeof auth).toBe("object");
    });
  });

  describe("getSession", () => {
    it("should be a function", () => {
      expect(typeof getSession).toBe("function");
    });
  });
});
