import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sentry env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows missing sentry vars", async () => {
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ORG;
    delete process.env.SENTRY_PROJECT;
    delete process.env.SENTRY_AUTH_TOKEN;

    const { env } = await import("./sentry.js");

    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.SENTRY_ORG).toBeUndefined();
    expect(env.SENTRY_PROJECT).toBeUndefined();
    expect(env.SENTRY_AUTH_TOKEN).toBeUndefined();
  });

  it("reads sentry vars when provided", async () => {
    process.env.SENTRY_DSN = "https://example.com";
    process.env.SENTRY_ORG = "gemhog";
    process.env.SENTRY_PROJECT = "web";
    process.env.SENTRY_AUTH_TOKEN = "token";

    const { env } = await import("./sentry.js");

    expect(env.SENTRY_DSN).toBe("https://example.com");
    expect(env.SENTRY_ORG).toBe("gemhog");
    expect(env.SENTRY_PROJECT).toBe("web");
    expect(env.SENTRY_AUTH_TOKEN).toBe("token");
  });
});
