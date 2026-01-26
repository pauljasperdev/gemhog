import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import dotenv from "dotenv";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const webDir = path.resolve(__dirname, "..");
const envExample = dotenv.parse(
  readFileSync(path.join(webDir, ".env.example")),
);

describe("web build with .env.example", () => {
  it("should succeed with .env.example configuration", async () => {
    const { stdout, stderr } = await execAsync("pnpm build", {
      cwd: webDir,
      env: {
        ...process.env,
        ...envExample,
      },
    });
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 120000);

  it("should succeed with OpenNext build", async () => {
    const { stdout, stderr } = await execAsync("pnpm build:opennext", {
      cwd: webDir,
      env: {
        ...process.env,
        ...envExample,
      },
    });
    expect(stdout + stderr).not.toContain(
      "File server/instrumentation.js does not exist",
    );
  }, 180000);
});
