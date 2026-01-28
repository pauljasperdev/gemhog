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

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3000");
    });

    it("should use local defaults in development", async () => {
      delete process.env.NEXT_PUBLIC_SERVER_URL;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      process.env.LOCAL_ENV = "1";

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SERVER_URL).toBe(
        localDevWebEnv.NEXT_PUBLIC_SERVER_URL,
      );
      expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe(
        localDevWebEnv.NEXT_PUBLIC_SENTRY_DSN,
      );
    });
  });

  describe("optional vars", () => {
    it("should succeed without NEXT_PUBLIC_SENTRY_DSN", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
    });

    it("should succeed with NEXT_PUBLIC_SENTRY_DSN set", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe("https://key@sentry.io/123");
    });

    it("should treat empty NEXT_PUBLIC_SENTRY_DSN as undefined", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "";

      const { env } = await import("./web.js");

      expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
    });
  });
});
