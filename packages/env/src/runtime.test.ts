import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("runtime env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults when flags are missing", async () => {
    delete process.env.NODE_ENV;
    delete process.env.NEXT_RUNTIME;
    delete process.env.SST_DEV;
    delete process.env.CI;
    delete process.env.CODEBUILD_BUILD_ID;

    const runtime = await import("./runtime.js");

    expect(runtime.nodeEnv).toBe("development");
    expect(runtime.isDev).toBe(true);
    expect(runtime.isProd).toBe(false);
    expect(runtime.isTest).toBe(false);
    expect(runtime.nextRuntime).toBeUndefined();
    expect(runtime.isSstDev).toBe(false);
    expect(runtime.isCi).toBe(false);
    expect(runtime.codebuildBuildId).toBeUndefined();
  });

  it("uses explicit runtime flags when set", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_RUNTIME = "edge";
    process.env.SST_DEV = "1";
    process.env.CI = "true";
    process.env.CODEBUILD_BUILD_ID = "build-123";

    const runtime = await import("./runtime.js");

    expect(runtime.nodeEnv).toBe("production");
    expect(runtime.isDev).toBe(false);
    expect(runtime.isProd).toBe(true);
    expect(runtime.isTest).toBe(false);
    expect(runtime.nextRuntime).toBe("edge");
    expect(runtime.isSstDev).toBe(true);
    expect(runtime.isCi).toBe(true);
    expect(runtime.codebuildBuildId).toBe("build-123");
  });
});
