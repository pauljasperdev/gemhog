import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localClientEnv, localServerEnv } from "../src/local-dev";

/**
 * GUARDRAIL: Ensures every server env var in the schema has a corresponding test.
 * If this test fails, you added an env var to server.ts but forgot to test it.
 */
describe("server env var test coverage", () => {
  it("every server env var in schema must have a test", () => {
    const testPath = path.join(__dirname, "env.test.ts");

    const testContent = fs.readFileSync(testPath, "utf-8");

    const schemaVars = Object.keys(localServerEnv);

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
    const schemaPath = path.join(__dirname, "..", "src", "client.ts");
    const testPath = path.join(__dirname, "env.test.ts");

    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const testContent = fs.readFileSync(testPath, "utf-8");

    const envVarPattern = /(NEXT_PUBLIC_\w+):\s*Effect\.Config\./gm;
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

describe("server env injection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("does not override env vars when already set", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.DATABASE_URL_POOLER = "postgresql://localhost:5432/test";
    process.env.BETTER_AUTH_SECRET = "super-secret-key-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3001";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-api-key";
    process.env.PODSCAN_API_TOKEN = "podscan-test-token";
    process.env.PODSCAN_BASE_URL = "https://api.podscan.fm/v1";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SENTRY_DSN = "https://key@sentry.io/123";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.LOCAL_ENV = "1";

    await import("../src/server.js");

    expect(process.env.DATABASE_URL).toBe("postgresql://localhost:5432/test");
    expect(process.env.DATABASE_URL_POOLER).toBe(
      "postgresql://localhost:5432/test",
    );
    expect(process.env.BETTER_AUTH_SECRET).toBe(
      "super-secret-key-at-least-32-chars",
    );
    expect(process.env.PODSCAN_API_TOKEN).toBe("podscan-test-token");
    expect(process.env.PODSCAN_BASE_URL).toBe("https://api.podscan.fm/v1");
  });

  it("uses local defaults when LOCAL_ENV=1", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_POOLER;
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.APP_URL;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.PODSCAN_API_TOKEN;
    delete process.env.PODSCAN_BASE_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.SENTRY_DSN;
    delete process.env.ADMIN_EMAIL;
    process.env.LOCAL_ENV = "1";

    await import("../src/server.js");

    expect(process.env.DATABASE_URL).toBe(localServerEnv.DATABASE_URL);
    expect(process.env.DATABASE_URL_POOLER).toBe(
      localServerEnv.DATABASE_URL_POOLER,
    );
    expect(process.env.BETTER_AUTH_SECRET).toBe(
      localServerEnv.BETTER_AUTH_SECRET,
    );
    expect(process.env.BETTER_AUTH_URL).toBe(localServerEnv.BETTER_AUTH_URL);
    expect(process.env.APP_URL).toBe(localServerEnv.APP_URL);
    expect(process.env.GOOGLE_GENERATIVE_AI_API_KEY).toBe(
      localServerEnv.GOOGLE_GENERATIVE_AI_API_KEY,
    );
    expect(process.env.PODSCAN_API_TOKEN).toBe(
      localServerEnv.PODSCAN_API_TOKEN,
    );
    expect(process.env.PODSCAN_BASE_URL).toBe(localServerEnv.PODSCAN_BASE_URL);
    expect(process.env.RESEND_API_KEY).toBe(localServerEnv.RESEND_API_KEY);
    expect(process.env.SENTRY_DSN).toBe(localServerEnv.SENTRY_DSN);
    expect(process.env.ADMIN_EMAIL).toBe(localServerEnv.ADMIN_EMAIL);
  });

  it("does nothing when LOCAL_ENV is not set", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_POOLER;
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.APP_URL;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.PODSCAN_API_TOKEN;
    delete process.env.PODSCAN_BASE_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.SENTRY_DSN;
    delete process.env.ADMIN_EMAIL;
    delete process.env.LOCAL_ENV;

    await import("../src/server.js");

    expect(process.env.DATABASE_URL).toBeUndefined();
    expect(process.env.BETTER_AUTH_SECRET).toBeUndefined();
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
      const { loadClientEnv } = await import("../src/client.js");

      expect(() => loadClientEnv()).toThrow();
    });

    it("should fail when NEXT_PUBLIC_SERVER_URL is empty string", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "";
      const { loadClientEnv } = await import("../src/client.js");

      expect(() => loadClientEnv()).toThrow();
    });

    it("should fail when NEXT_PUBLIC_SENTRY_DSN is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const { loadClientEnv } = await import("../src/client.js");

      expect(() => loadClientEnv()).toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { loadClientEnv } = await import("../src/client.js");

      expect(() => loadClientEnv()).toThrow();
    });

    it("should fail when NEXT_PUBLIC_POSTHOG_HOST is missing", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      const { loadClientEnv } = await import("../src/client.js");

      expect(() => loadClientEnv()).toThrow();
    });
  });

  describe("valid config", () => {
    it("should succeed when all client vars are set", async () => {
      process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@sentry.io/123";
      process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
      process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://eu.i.posthog.com";

      const { loadClientEnv } = await import("../src/client.js");
      const clientEnv = loadClientEnv();

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

      const { loadClientEnv } = await import("../src/client.js");
      const clientEnv = loadClientEnv();

      expect(clientEnv.NEXT_PUBLIC_SERVER_URL).toBe(
        localClientEnv.NEXT_PUBLIC_SERVER_URL,
      );
      expect(clientEnv.NEXT_PUBLIC_SENTRY_DSN).toBe(
        localClientEnv.NEXT_PUBLIC_SENTRY_DSN,
      );
      expect(clientEnv.NEXT_PUBLIC_POSTHOG_KEY).toBe(
        localClientEnv.NEXT_PUBLIC_POSTHOG_KEY,
      );
      expect(clientEnv.NEXT_PUBLIC_POSTHOG_HOST).toBe(
        localClientEnv.NEXT_PUBLIC_POSTHOG_HOST,
      );
    });
  });
});

describe("client runtime env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads NEXT_PUBLIC vars without validation", async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3001";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "";
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "";

    const { clientEnv } = await import("../src/client-runtime.js");

    expect(clientEnv.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3001");
    expect(clientEnv.NEXT_PUBLIC_SENTRY_DSN).toBe("");
    expect(clientEnv.NEXT_PUBLIC_POSTHOG_KEY).toBe("");
    expect(clientEnv.NEXT_PUBLIC_POSTHOG_HOST).toBe("");
  });
});
