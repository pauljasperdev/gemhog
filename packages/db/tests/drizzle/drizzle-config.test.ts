import { localServerEnv } from "@gemhog/env/local-dev";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

const importConfig = async () => {
  vi.resetModules();
  return import("../../drizzle.config");
};

describe("drizzle.config", () => {
  it("falls back to localhost when DATABASE_URL missing", async () => {
    process.env = {
      ...originalEnv,
      DOTENV_CONFIG_PATH: "/nonexistent.env",
    };
    delete process.env.DATABASE_URL;

    const config = (await importConfig()).default as {
      dbCredentials: { url: string };
    };

    expect(config.dbCredentials.url).toBe(localServerEnv.DATABASE_URL);
  });

  it("uses DATABASE_URL when explicitly provided", async () => {
    const customUrl = "postgresql://test:test@remote:5432/testdb";
    process.env = {
      ...originalEnv,
      DATABASE_URL: customUrl,
      DOTENV_CONFIG_PATH: "/nonexistent.env",
    };

    const config = (await importConfig()).default as {
      dbCredentials: { url: string };
    };

    expect(config.dbCredentials.url).toBe(customUrl);
  });
});

afterEach(() => {
  process.env = { ...originalEnv };
});
