import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

/**
 * Tests server startup failure when required env vars are missing.
 * Uses DOTENV_CONFIG_PATH=/nonexistent to prevent .env auto-loading.
 */
describe("server startup", () => {
  const serverDir = path.resolve(__dirname, "..");

  const runServer = async (envVars: Record<string, string>) => {
    const baseEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      DOTENV_CONFIG_PATH: "/nonexistent/.env",
    };
    try {
      await execAsync("pnpm tsx src/serve.ts", {
        cwd: serverDir,
        env: { ...baseEnv, ...envVars } as unknown as NodeJS.ProcessEnv,
      });
      return { code: 0, output: "" };
    } catch (error) {
      const { stdout = "", stderr = "" } = error as {
        stdout?: string;
        stderr?: string;
      };
      return { code: 1, output: stdout + stderr };
    }
  };

  it("should fail when DATABASE_URL is missing", async () => {
    const { code, output } = await runServer({});
    expect(code).not.toBe(0);
    expect(output).toContain("DATABASE_URL");
  }, 10000);

  it("should fail when BETTER_AUTH_SECRET is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("BETTER_AUTH_SECRET");
  }, 10000);

  it("should fail when BETTER_AUTH_URL is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("BETTER_AUTH_URL");
  }, 10000);

  it("should fail when CORS_ORIGIN is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("CORS_ORIGIN");
  }, 10000);
});
