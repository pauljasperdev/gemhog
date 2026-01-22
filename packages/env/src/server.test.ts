import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("server env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("missing required vars", () => {
    it("should fail when DATABASE_URL is missing", async () => {
      delete process.env.DATABASE_URL;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when BETTER_AUTH_SECRET is missing", async () => {
      delete process.env.BETTER_AUTH_SECRET;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when BETTER_AUTH_URL is missing", async () => {
      delete process.env.BETTER_AUTH_URL;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when CORS_ORIGIN is missing", async () => {
      delete process.env.CORS_ORIGIN;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when GOOGLE_GENERATIVE_AI_API_KEY is missing", async () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      await expect(import("./server.js")).rejects.toThrow();
    });
  });

  describe("valid config", () => {
    it("should succeed with all required vars", async () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";
      process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";
      process.env.CORS_ORIGIN = "http://localhost:3001";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";

      const { env } = await import("./server.js");

      expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
      expect(env.CORS_ORIGIN).toBe("http://localhost:3001");
      expect(env.GOOGLE_GENERATIVE_AI_API_KEY).toBe("test-google-api-key");
    });

    it("should default NODE_ENV to 'development' when not provided", async () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";
      process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";
      process.env.CORS_ORIGIN = "http://localhost:3001";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";
      delete process.env.NODE_ENV;

      const { env } = await import("./server.js");

      expect(env.NODE_ENV).toBe("development");
    });

    it("should use provided NODE_ENV when specified", async () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";
      process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";
      process.env.CORS_ORIGIN = "http://localhost:3001";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";
      process.env.NODE_ENV = "production";

      const { env } = await import("./server.js");

      expect(env.NODE_ENV).toBe("production");
    });
  });
});
