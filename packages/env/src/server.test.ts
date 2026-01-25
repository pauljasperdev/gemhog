import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GUARDRAIL: Ensures every env var in the schema has a corresponding test.
 * If this test fails, you added an env var to server.ts but forgot to test it.
 */
describe("env var test coverage", () => {
  it("every env var in schema must have a test", () => {
    const schemaPath = path.join(__dirname, "server.ts");
    const testPath = path.join(__dirname, "server.test.ts");

    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const testContent = fs.readFileSync(testPath, "utf-8");

    // Extract env var names from schema (matches: SOME_VAR: z.something())
    const envVarPattern = /^\s+([A-Z][A-Z0-9_]+):\s*z\./gm;
    const schemaVars = [...schemaContent.matchAll(envVarPattern)].map(
      (m) => m[1],
    );

    // Check each schema var appears in tests
    const missingTests = schemaVars.filter(
      (varName) => !testContent.includes(varName),
    );

    if (missingTests.length > 0) {
      throw new Error(
        `Missing tests for env vars: ${missingTests.join(", ")}\n` +
          "Add tests for these variables in server.test.ts",
      );
    }

    expect(schemaVars.length).toBeGreaterThan(0);
  });
});

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

    it("should fail when DATABASE_URL_POOLER is missing", async () => {
      delete process.env.DATABASE_URL_POOLER;
      await expect(import("./server.js")).rejects.toThrow();
    });
  });

  describe("valid config", () => {
    it("should succeed with all required vars", async () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";
      process.env.DATABASE_URL_POOLER = "postgresql://localhost:5432/test";
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
      process.env.DATABASE_URL_POOLER = "postgresql://localhost:5432/test";
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
      process.env.DATABASE_URL_POOLER = "postgresql://localhost:5432/test";
      process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";
      process.env.CORS_ORIGIN = "http://localhost:3001";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";
      process.env.NODE_ENV = "production";

      const { env } = await import("./server.js");

      expect(env.NODE_ENV).toBe("production");
    });
  });

  describe("optional Sentry vars", () => {
    const setRequiredEnvVars = () => {
      process.env.DATABASE_URL = "postgresql://localhost:5432/test";
      process.env.DATABASE_URL_POOLER = "postgresql://localhost:5432/test";
      process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
      process.env.BETTER_AUTH_URL = "http://localhost:3000";
      process.env.CORS_ORIGIN = "http://localhost:3001";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";
    };

    it("should succeed without any Sentry vars", async () => {
      setRequiredEnvVars();
      delete process.env.SENTRY_DSN;
      delete process.env.SENTRY_AUTH_TOKEN;
      delete process.env.SENTRY_ORG;
      delete process.env.SENTRY_PROJECT;

      const { env } = await import("./server.js");

      expect(env.SENTRY_DSN).toBeUndefined();
      expect(env.SENTRY_AUTH_TOKEN).toBeUndefined();
      expect(env.SENTRY_ORG).toBeUndefined();
      expect(env.SENTRY_PROJECT).toBeUndefined();
    });

    it("should succeed with all Sentry vars set", async () => {
      setRequiredEnvVars();
      process.env.SENTRY_DSN = "https://key@sentry.io/123";
      process.env.SENTRY_AUTH_TOKEN = "sntrys_test_token";
      process.env.SENTRY_ORG = "my-org";
      process.env.SENTRY_PROJECT = "my-project";

      const { env } = await import("./server.js");

      expect(env.SENTRY_DSN).toBe("https://key@sentry.io/123");
      expect(env.SENTRY_AUTH_TOKEN).toBe("sntrys_test_token");
      expect(env.SENTRY_ORG).toBe("my-org");
      expect(env.SENTRY_PROJECT).toBe("my-project");
    });

    it("should treat empty Sentry vars as undefined", async () => {
      setRequiredEnvVars();
      process.env.SENTRY_DSN = "";
      process.env.SENTRY_AUTH_TOKEN = "";
      process.env.SENTRY_ORG = "";
      process.env.SENTRY_PROJECT = "";

      const { env } = await import("./server.js");

      expect(env.SENTRY_DSN).toBeUndefined();
      expect(env.SENTRY_AUTH_TOKEN).toBeUndefined();
      expect(env.SENTRY_ORG).toBeUndefined();
      expect(env.SENTRY_PROJECT).toBeUndefined();
    });
  });
});
