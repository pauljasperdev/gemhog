import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDevServerEnv, localDevWebEnv } from "./local-dev";

/**
 * GUARDRAIL: Ensures every server env var in the schema has a corresponding test.
 * If this test fails, you added an env var to server.ts but forgot to test it.
 */
describe("server env var test coverage", () => {
  it("every server env var in schema must have a test", () => {
    const schemaPath = path.join(__dirname, "server.ts");
    const testPath = path.join(__dirname, "env.test.ts");

    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const testContent = fs.readFileSync(testPath, "utf-8");

    const envVarPattern = /([A-Z][A-Z0-9_]+):\s*Schema\.NonEmptyString/gm;
    const schemaVars = [
      ...new Set(
        [...schemaContent.matchAll(envVarPattern)]
          .map((m) => m[1])
          .filter((value): value is string => Boolean(value))
          .filter((v) => !v.startsWith("NEXT_PUBLIC_")),
      ),
    ];

    const missingTests = schemaVars.filter(
      (varName) => !testContent.includes(varName),
    );

    if (missingTests.length > 0) {
      throw new Error(
        `Missing tests for env vars: ${missingTests.join(", ")}\n` +
          "Add tests for these variables in env.test.ts",
      );
    }

    expect(schemaVars.length).toBeGreaterThan(0);
  });
});

/**
 * GUARDRAIL: Ensures every client env var in the schema has a corresponding test.
 */
describe("client env var test coverage", () => {
  it("every client env var in schema must have a test", () => {
    const schemaPath = path.join(__dirname, "client.ts");
    const testPath = path.join(__dirname, "env.test.ts");

    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const testContent = fs.readFileSync(testPath, "utf-8");

    const envVarPattern = /(NEXT_PUBLIC_\w+):\s*Schema\./gm;
    const schemaVars = [...schemaContent.matchAll(envVarPattern)]
      .map((m) => m[1])
      .filter((value): value is string => Boolean(value));

    const missingTests = schemaVars.filter(
      (varName) => !testContent.includes(varName),
    );

    if (missingTests.length > 0) {
      throw new Error(
        `Missing tests for env vars: ${missingTests.join(", ")}\n` +
          "Add tests for these variables in env.test.ts",
      );
    }

    expect(schemaVars.length).toBeGreaterThan(0);
  });
});

describe("serverEnv validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const setRequiredEnvVars = () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.DATABASE_URL_POOLER = "postgresql://localhost:5432/test";
    process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3001";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SENTRY_DSN = "https://key@sentry.io/123";
  };

  describe("missing required vars", () => {
    it("should fail when DATABASE_URL is missing", async () => {
      setRequiredEnvVars();
      delete process.env.DATABASE_URL;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when DATABASE_URL_POOLER is missing", async () => {
      setRequiredEnvVars();
      delete process.env.DATABASE_URL_POOLER;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when BETTER_AUTH_SECRET is missing", async () => {
      setRequiredEnvVars();
      delete process.env.BETTER_AUTH_SECRET;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when BETTER_AUTH_URL is missing", async () => {
      setRequiredEnvVars();
      delete process.env.BETTER_AUTH_URL;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when APP_URL is missing", async () => {
      setRequiredEnvVars();
      delete process.env.APP_URL;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when GOOGLE_GENERATIVE_AI_API_KEY is missing", async () => {
      setRequiredEnvVars();
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when RESEND_API_KEY is missing", async () => {
      setRequiredEnvVars();
      delete process.env.RESEND_API_KEY;
      await expect(import("./server.js")).rejects.toThrow();
    });

    it("should fail when SENTRY_DSN is missing", async () => {
      setRequiredEnvVars();
      delete process.env.SENTRY_DSN;
      await expect(import("./server.js")).rejects.toThrow();
    });
  });

  describe("valid config", () => {
    it("should succeed with all required vars", async () => {
      setRequiredEnvVars();

      const { serverEnv } = await import("./server.js");

      expect(serverEnv.BETTER_AUTH_URL).toBe("http://localhost:3000");
      expect(serverEnv.APP_URL).toBe("http://localhost:3001");
      expect(serverEnv.GOOGLE_GENERATIVE_AI_API_KEY).toBe(
        "test-google-api-key",
      );
      expect(serverEnv.SENTRY_DSN).toBe("https://key@sentry.io/123");
    });

    it("should use local defaults in development", async () => {
      delete process.env.DATABASE_URL;
      delete process.env.DATABASE_URL_POOLER;
      delete process.env.BETTER_AUTH_SECRET;
      delete process.env.BETTER_AUTH_URL;
      delete process.env.APP_URL;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.SENTRY_DSN;
      process.env.LOCAL_ENV = "1";

      const { serverEnv } = await import("./server.js");

      expect(serverEnv.DATABASE_URL).toBe(localDevServerEnv.DATABASE_URL);
      expect(serverEnv.DATABASE_URL_POOLER).toBe(
        localDevServerEnv.DATABASE_URL_POOLER,
      );
      expect(serverEnv.BETTER_AUTH_SECRET).toBe(
        localDevServerEnv.BETTER_AUTH_SECRET,
      );
      expect(serverEnv.BETTER_AUTH_URL).toBe(localDevServerEnv.BETTER_AUTH_URL);
      expect(serverEnv.APP_URL).toBe(localDevServerEnv.APP_URL);
      expect(serverEnv.GOOGLE_GENERATIVE_AI_API_KEY).toBe(
        localDevServerEnv.GOOGLE_GENERATIVE_AI_API_KEY,
      );
      expect(serverEnv.RESEND_API_KEY).toBe(localDevServerEnv.RESEND_API_KEY);
      expect(serverEnv.SENTRY_DSN).toBe(localDevServerEnv.SENTRY_DSN);
    });
  });
});

describe("clientEnv validation", () => {
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
      await expect(import("./client.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_SERVER_URL is empty string", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "";
      await expect(import("./client.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_SENTRY_DSN is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      await expect(import("./client.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      await expect(import("./client.js")).rejects.toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_HOST is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      await expect(import("./client.js")).rejects.toThrow();
    });
  });

  describe("valid config", () => {
    it("should succeed when all client vars are set", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";

      const { clientEnv } = await import("./client.js");

      expect(clientEnv.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3000");
      expect(clientEnv.NEXT_PUBLIC_SENTRY_DSN).toBe(
        "https://key@sentry.io/123",
      );
      expect(clientEnv.NEXT_PUBLIC_POSTHOG_KEY).toBe("phc_test123");
      expect(clientEnv.NEXT_PUBLIC_POSTHOG_HOST).toBe(
        "https://eu.i.posthog.com",
      );
    });

    it("should use local defaults in development", async () => {
      delete process.env.NEXT_PUBLIC_SERVER_URL;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      process.env.LOCAL_ENV = "1";

      const { clientEnv } = await import("./client.js");

      expect(clientEnv.NEXT_PUBLIC_SERVER_URL).toBe(
        localDevWebEnv.NEXT_PUBLIC_SERVER_URL,
      );
      expect(clientEnv.NEXT_PUBLIC_SENTRY_DSN).toBe(
        localDevWebEnv.NEXT_PUBLIC_SENTRY_DSN,
      );
      expect(clientEnv.NEXT_PUBLIC_POSTHOG_KEY).toBe(
        localDevWebEnv.NEXT_PUBLIC_POSTHOG_KEY,
      );
      expect(clientEnv.NEXT_PUBLIC_POSTHOG_HOST).toBe(
        localDevWebEnv.NEXT_PUBLIC_POSTHOG_HOST,
      );
    });
  });
});
