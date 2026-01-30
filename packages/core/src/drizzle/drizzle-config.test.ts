import { localDevServerEnv } from "@gemhog/env/local-dev";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

const importConfig = async () => {
  vi.resetModules();
  return import("../../drizzle.config");
};

describe("drizzle.config", () => {
  it("uses local defaults when LOCAL_ENV=1", async () => {
    process.env = {
      ...originalEnv,
      LOCAL_ENV: "1",
      DOTENV_CONFIG_PATH: "/nonexistent.env",
    };
    delete process.env.DATABASE_URL;

    const config = (await importConfig()).default as {
      dbCredentials: { url: string };
    };

    expect(config.dbCredentials.url).toBe(localDevServerEnv.DATABASE_URL);
  });

  it("throws when DATABASE_URL is missing without LOCAL_ENV", async () => {
    process.env = { ...originalEnv };
    process.env.DOTENV_CONFIG_PATH = "/nonexistent.env";
    delete process.env.LOCAL_ENV;
    delete process.env.DATABASE_URL;

    await expect(importConfig()).rejects.toThrow();
  });
});

afterEach(() => {
  process.env = { ...originalEnv };
});
