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
