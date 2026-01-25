import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
