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
  it.skipIf(Number.parseInt(process.versions.node.split(".")[0], 10) >= 25)(
    "should succeed with local defaults",
    async () => {
      // FIXME: These tests are flaky on Node.js 25 with Turbopack due to filesystem
      // race conditions (ENOENT for .next temp files). The builds succeed when run
      // directly but fail intermittently through vitest's child process exec.
      // Re-enable when Turbopack build stability improves or Node.js LTS is used.
      const { stdout, stderr } = await execAsync("pnpm build", {
        cwd: webDir,
        env: buildEnv,
      });
      expect(stdout + stderr).not.toContain("Invalid environment variables");
    },
    120000,
  );

  // OpenNext internally runs `pnpm build` (Turbopack) -- same ENOENT flake on Node.js 25
  it.skipIf(Number.parseInt(process.versions.node.split(".")[0], 10) >= 25)(
    "should succeed with OpenNext build",
    async () => {
      const { stdout, stderr } = await execAsync("pnpm build:opennext", {
        cwd: webDir,
        env: buildEnv,
      });
      expect(stdout + stderr).not.toContain(
        "File server/instrumentation.js does not exist",
      );
    },
    180000,
  );
});
