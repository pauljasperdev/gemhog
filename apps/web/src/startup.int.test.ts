import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { localDevServerEnv, localDevWebEnv } from "@gemhog/env/local-dev";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const webDir = path.resolve(__dirname, "..");
const buildEnv = {
  ...process.env,
  ...localDevServerEnv,
  ...localDevWebEnv,
  LOCAL_ENV: "1",
};

describe("web build with local defaults", () => {
  it("should succeed with local defaults", async () => {
    const { stdout, stderr } = await execAsync("pnpm build", {
      cwd: webDir,
      env: buildEnv,
    });
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 120000);

  it("should succeed with OpenNext build", async () => {
    const { stdout, stderr } = await execAsync("pnpm build:opennext", {
      cwd: webDir,
      env: buildEnv,
    });
    expect(stdout + stderr).not.toContain(
      "File server/instrumentation.js does not exist",
    );
  }, 180000);
});
