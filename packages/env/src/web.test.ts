import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDevWebEnv } from "./local-dev";

/**
 * GUARDRAIL: Ensures every env var in the schema has a corresponding test.
 * If this test fails, you added an env var to web.ts but forgot to test it.
 */
describe("env var test coverage", () => {
  it("every env var in schema must have a test", () => {
    const schemaPath = path.join(__dirname, "web.ts");
    const testPath = path.join(__dirname, "web.test.ts");

    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const testContent = fs.readFileSync(testPath, "utf-8");

    // Extract env var names from schema (matches: SOME_VAR: z.something())
    const envVarPattern = /^\s+(NEXT_PUBLIC_\w+|[A-Z][A-Z0-9_]+):\s*z\./gm;
    const schemaVars = [...schemaContent.matchAll(envVarPattern)]
      .map((m) => m[1])
      .filter((value): value is string => Boolean(value));

    // Check each schema var appears in tests
    const missingTests = schemaVars.filter(
      (varName) => !testContent.includes(varName),
    );

    if (missingTests.length > 0) {
      throw new Error(
        `Missing tests for env vars: ${missingTests.join(", ")}\n` +
          "Add tests for these variables in web.test.ts",
      );
    }

    expect(schemaVars.length).toBeGreaterThan(0);
  });
});

describe("web env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("required vars", () => {
    it("should fail when NEXT_PUBLIC_SERVER_URL is missing", async () => {
      delete process.env.NEXT_PUBLIC_SERVER_URL;

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_SERVER_URL is empty string", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "";

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_SERVER_URL is not a valid URL", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "not-a-url";

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should succeed when NEXT_PUBLIC_SERVER_URL is a valid URL", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3000");
    });

    it("should use local defaults in development", async () => {
      delete process.env.NEXT_PUBLIC_SERVER_URL;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      process.env.LOCAL_ENV = "1";

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SERVER_URL).toBe(
        localDevWebEnv.NEXT_PUBLIC_SERVER_URL,
      );
      expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe(
        localDevWebEnv.NEXT_PUBLIC_SENTRY_DSN,
      );
      expect(env.NEXT_PUBLIC_POSTHOG_KEY).toBe(
        localDevWebEnv.NEXT_PUBLIC_POSTHOG_KEY,
      );
      expect(env.NEXT_PUBLIC_POSTHOG_HOST).toBe(
        localDevWebEnv.NEXT_PUBLIC_POSTHOG_HOST,
      );
    });
  });

  describe("validation", () => {
    it("should fail when NEXT_PUBLIC_SENTRY_DSN is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_HOST is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_HOST is not a valid URL", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "not-a-url";

      await expect(import("./web.js")).rejects.toThrow();
    });

    it("should succeed with all vars set", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe("https://key@sentry.io/123");
      expect(env.NEXT_PUBLIC_POSTHOG_KEY).toBe("phc_test123");
      expect(env.NEXT_PUBLIC_POSTHOG_HOST).toBe("https://eu.i.posthog.com");
    });
  });
});
