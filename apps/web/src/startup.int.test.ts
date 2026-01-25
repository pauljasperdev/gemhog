import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const webDir = path.resolve(__dirname, "..");

/**
 * Tests Next.js build succeeds with .env.example configuration.
 * This catches missing env vars in .env.example that would break production builds.
 *
 * Note: Negative tests (build fails when var missing) are covered by:
 * - packages/env/src/web.test.ts (env validation unit tests)
 * - The guardrail test ensures all schema vars have tests
 *
 * We don't test "build fails when var missing" here because:
 * - Requires temp directory with symlinks (fragile, platform-dependent)
 * - pnpm symlinks don't resolve correctly on Mac
 * - Env validation is already tested at the module level
 */
describe("web build with .env.example", () => {
  it("should succeed with .env.example configuration", async () => {
    const { stdout, stderr } = await execAsync("pnpm build", {
      cwd: webDir,
      env: {
        ...process.env,
      },
    });
    // Build should complete without error
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 120000);
});
