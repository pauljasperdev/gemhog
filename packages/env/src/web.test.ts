// packages/env/src/web.test.ts
// Unit tests for web env validation
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("web env validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset module cache before each test
    vi.resetModules();
    // Create a fresh copy of process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should fail when NEXT_PUBLIC_SERVER_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SERVER_URL;

    await expect(import("./web.js")).rejects.toThrow(
      "NEXT_PUBLIC_SERVER_URL is required",
    );
  });

  it("should succeed when NEXT_PUBLIC_SERVER_URL is provided", async () => {
    process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";

    const { env } = await import("./web.js");

    expect(env.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3000");
  });
});
