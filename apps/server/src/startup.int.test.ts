import { spawn } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Integration tests for server startup failure scenarios.
 *
 * These tests spawn the actual server process with missing env vars
 * and verify it fails fast with clear error messages.
 *
 * This validates the Effect Config validation in @gemhog/env/server.
 */
describe("server startup", () => {
  const serverPath = path.resolve(__dirname, "index.ts");
  // Use tsx from node_modules/.bin - available via pnpm workspace hoisting
  const tsxPath = path.resolve(__dirname, "..", "node_modules", ".bin", "tsx");

  const runServer = (
    env: Record<string, string>,
  ): Promise<{ code: number | null; stderr: string; stdout: string }> => {
    return new Promise((resolve) => {
      const proc = spawn(tsxPath, [serverPath], {
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

  it("should fail when DATABASE_URL is missing", async () => {
    const { code, stderr, stdout } = await runServer({});
    expect(code).not.toBe(0);
    // Effect Config error message contains the missing variable name
    const output = stdout + stderr;
    expect(output).toContain("DATABASE_URL");
  }, 10000);

  it("should fail when BETTER_AUTH_SECRET is missing", async () => {
    const { code, stderr, stdout } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
    });
    expect(code).not.toBe(0);
    const output = stdout + stderr;
    expect(output).toContain("BETTER_AUTH_SECRET");
  }, 10000);

  it("should fail when BETTER_AUTH_URL is missing", async () => {
    const { code, stderr, stdout } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    });
    expect(code).not.toBe(0);
    const output = stdout + stderr;
    expect(output).toContain("BETTER_AUTH_URL");
  }, 10000);

  it("should fail when CORS_ORIGIN is missing", async () => {
    const { code, stderr, stdout } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
    });
    expect(code).not.toBe(0);
    const output = stdout + stderr;
    expect(output).toContain("CORS_ORIGIN");
  }, 10000);
});
