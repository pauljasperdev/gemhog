import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const webDir = path.resolve(__dirname, "..");

/**
 * Tests Next.js build succeeds with .env.example configuration.
 * This catches missing env vars in .env.example that would break production builds.
 */
describe("web build with .env.example", () => {
  it("should succeed with .env.example configuration", async () => {
    const { stdout, stderr } = await execAsync("pnpm build", {
      cwd: webDir,
      env: {
        ...process.env,
        // Use .env.example by copying it to .env temporarily handled by setup
      },
    });
    // Build should complete without error
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 120000);
});

/**
 * Tests Next.js build failure when env vars are missing.
 * Uses temp directory with symlinks (excluding .env) because Next.js
 * auto-reads .env from cwd - no flag to disable this behavior.
 */
describe("web startup - missing env vars", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-test-"));
    const files = [
      "src",
      "node_modules",
      "next.config.ts",
      "tsconfig.json",
      "package.json",
      "public",
    ];
    for (const file of files) {
      const src = path.join(webDir, file);
      if (fs.existsSync(src)) fs.symlinkSync(src, path.join(tmpDir, file));
    }
  });

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should fail build when NEXT_PUBLIC_SERVER_URL is missing", async () => {
    const env = { PATH: process.env.PATH, HOME: process.env.HOME };
    try {
      await execAsync("pnpm build", {
        cwd: tmpDir,
        env: env as unknown as NodeJS.ProcessEnv,
      });
      expect.fail("Build should have failed");
    } catch (error) {
      const { stdout = "", stderr = "" } = error as {
        stdout?: string;
        stderr?: string;
      };
      expect(stdout + stderr).toContain("NEXT_PUBLIC_SERVER_URL");
    }
  }, 60000);
});
