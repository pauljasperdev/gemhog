import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Integration tests for web app startup failure scenarios.
 *
 * These tests spawn the actual Next.js build process with missing env vars
 * and verify it fails fast with clear error messages.
 *
 * We test `next build` (not `next dev`) because:
 * - Build validates env at startup via next.config.ts importing @gemhog/env/web
 * - Build is deterministic and fast to fail
 * - Dev server startup is slower and less suitable for CI
 *
 * Note: Next.js automatically reads .env files from the project directory.
 * To test missing env vars, we create a temp directory with symlinks to all
 * web app files EXCEPT the .env file, then run build from there.
 */
describe("web startup", () => {
  // Navigate from src/ up to apps/web/
  const webDir = path.resolve(__dirname, "..");
  // Use next from node_modules/.bin - available via pnpm workspace hoisting
  const nextPath = path.resolve(webDir, "node_modules", ".bin", "next");

  let tmpDir: string;

  beforeEach(() => {
    // Create temp directory with symlinks but no .env
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "web-startup-test-"));

    // Symlink all necessary files/directories EXCEPT .env
    const filesToLink = [
      "src",
      "node_modules",
      "next.config.ts",
      "tsconfig.json",
      "package.json",
    ];

    for (const file of filesToLink) {
      const source = path.join(webDir, file);
      const target = path.join(tmpDir, file);
      if (fs.existsSync(source)) {
        fs.symlinkSync(source, target);
      }
    }

    // Symlink public if it exists
    const publicDir = path.join(webDir, "public");
    if (fs.existsSync(publicDir)) {
      fs.symlinkSync(publicDir, path.join(tmpDir, "public"));
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  const runBuild = (
    cwd: string,
    env: Record<string, string>,
  ): Promise<{ code: number | null; stderr: string; stdout: string }> => {
    return new Promise((resolve) => {
      const proc = spawn(nextPath, ["build"], {
        cwd,
        env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      proc.on("close", (code) => {
        resolve({ code, stderr, stdout });
      });
    });
  };

  it("should fail build when NEXT_PUBLIC_SERVER_URL is missing", async () => {
    // Run build from temp directory (no .env file)
    const { code, stderr, stdout } = await runBuild(tmpDir, {});
    expect(code).not.toBe(0);
    // Error could be in stdout or stderr depending on Next.js version
    const output = stdout + stderr;
    expect(output).toContain("NEXT_PUBLIC_SERVER_URL");
  }, 30000); // Next.js build can take longer
});
