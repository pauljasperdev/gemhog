import { exec } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { localClientEnv, localServerEnv } from "@gemhog/env/local-dev";
import { beforeEach, describe, expect, it } from "vitest";

const execAsync = promisify(exec);
type ExecError = Error & { stdout?: string; stderr?: string };

const webDir = path.resolve(__dirname, "..");
const buildArtifacts = [".next", ".open-next"] as const;
const buildEnv = (): NodeJS.ProcessEnv => {
  const {
    CI,
    HOME,
    PATH,
    PNPM_HOME,
    SHELL,
    TERM,
    TMPDIR,
    USER,
    XDG_CONFIG_HOME,
    XDG_DATA_HOME,
  } = process.env;

  return {
    CI,
    HOME,
    PATH,
    PNPM_HOME,
    SHELL,
    TERM,
    TMPDIR,
    USER,
    XDG_CONFIG_HOME,
    XDG_DATA_HOME,
    ...localServerEnv,
    ...localClientEnv,
    LOCAL_ENV: "1",
    NODE_ENV: "production",
  };
};

const cleanupBuildArtifacts = () => {
  for (const artifact of buildArtifacts) {
    rmSync(path.join(webDir, artifact), { recursive: true, force: true });
  }
};

const isRetryableBuildFailure = (output: string) =>
  /Unable to acquire lock|_buildManifest\.js\.tmp|ENOENT: no such file or directory, open .*_buildManifest\.js\.tmp/s.test(
    output,
  );

const runBuild = async (command: string) => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    cleanupBuildArtifacts();

    try {
      return await execAsync(command, {
        cwd: webDir,
        env: buildEnv(),
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      const execError = error as ExecError;
      const output = `${execError.stdout ?? ""}${execError.stderr ?? error.message}`;

      if (attempt === 2 || !isRetryableBuildFailure(output)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError ?? new Error(`Build command failed: ${command}`);
};

describe("web build with local defaults", () => {
  beforeEach(() => {
    cleanupBuildArtifacts();
  });

  it("should succeed with local defaults", async () => {
    const { stdout, stderr } = await runBuild("pnpm build");
    expect(stdout + stderr).not.toContain("Invalid environment variables");
  }, 300000);

  it("should succeed with OpenNext build", async () => {
    const { stdout, stderr } = await runBuild("pnpm build:opennext");
    expect(stdout + stderr).not.toContain(
      "File server/instrumentation.js does not exist",
    );
  }, 300000);
});
