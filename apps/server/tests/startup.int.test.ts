import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { localServerEnv } from "@gemhog/env/local-dev";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const serverDir = path.resolve(__dirname, "..");

describe("server build with local defaults", () => {
  it("should succeed with local defaults", async () => {
    const { stdout, stderr } = await execAsync("pnpm build", {
      cwd: serverDir,
      env: {
        ...process.env,
        ...localServerEnv,
        LOCAL_ENV: "1",
        NODE_ENV: "production",
      },
    });
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 60000);
});
