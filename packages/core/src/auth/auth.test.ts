// packages/core/src/auth/auth.test.ts
import { describe, expect, it, vi } from "vitest";

// Mock the env module before any imports that use it
vi.mock("@gemhog/env/server", () => ({
  env: {
    DATABASE_URL: { value: "postgresql://test:test@localhost:5432/test" },
    BETTER_AUTH_SECRET: { value: "test-secret" },
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001",
    NODE_ENV: "test",
  },
}));

// Import after mocking
import { auth, getAuth, getSession } from "./auth.service";

// These tests verify the structure/exports of the auth module
// Full integration tests require actual database connection
describe("auth", () => {
  describe("getAuth", () => {
    it("should be a function", () => {
      expect(typeof getAuth).toBe("function");
    });
  });

  describe("auth proxy", () => {
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
