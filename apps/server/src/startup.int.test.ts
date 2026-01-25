import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const serverDir = path.resolve(__dirname, "..");

describe("server build with .env.example", () => {
  it("should succeed with .env.example configuration", async () => {
    const { stdout, stderr } = await execAsync("pnpm build", {
      cwd: serverDir,
      env: {
        ...process.env,
      },
    });
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 60000);
});
describe("server startup - missing env vars", () => {
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

  it("should fail when DATABASE_URL_POOLER is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("DATABASE_URL_POOLER");
  }, 10000);

  it("should fail when BETTER_AUTH_SECRET is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      DATABASE_URL_POOLER: "postgresql://localhost:5432/test",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("BETTER_AUTH_SECRET");
  }, 10000);

  it("should fail when BETTER_AUTH_URL is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      DATABASE_URL_POOLER: "postgresql://localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("BETTER_AUTH_URL");
  }, 10000);

  it("should fail when CORS_ORIGIN is missing", async () => {
    const { code, output } = await runServer({
      DATABASE_URL: "postgresql://localhost:5432/test",
      DATABASE_URL_POOLER: "postgresql://localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
    });
    expect(code).not.toBe(0);
    expect(output).toContain("CORS_ORIGIN");
  }, 10000);
});
