import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { localClientEnv, localServerEnv } from "@gemhog/env/local-dev";
import { describe, expect, it } from "vitest";

const webDir = path.resolve(__dirname, "..");
const buildEnv = (): NodeJS.ProcessEnv => {
  return {
    ...process.env,
    ...localServerEnv,
    ...localClientEnv,
    LOCAL_ENV: "1",
    NODE_ENV: "development",
  };
};

const waitForReady = (child: ReturnType<typeof spawn>) =>
  new Promise<string>((resolve, reject) => {
    let settled = false;
    let output = "";
    let baseUrl: string | null = null;

    const timeout = setTimeout(() => {
      settled = true;
      reject(new Error("Dev server did not become ready in time"));
    }, 30000);

    const finalize = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) {
        reject(new Error(`${error.message}\n${output}`));
      } else {
        resolve(baseUrl ?? "http://localhost:3001");
      }
    };

    const onData = (data: Buffer) => {
      output += data.toString();
      const urlMatch = output.match(/https?:\/\/localhost:\d+/i);
      if (urlMatch) {
        baseUrl = urlMatch[0];
      }
      if (/invalid environment variables/i.test(output)) {
        finalize(new Error("Dev server failed due to missing env vars"));
      }
      if (/ready in/i.test(output)) {
        finalize();
      }
    };

    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("error", (error) => finalize(error));
    child.on("exit", (code) => {
      if (settled) return;
      finalize(new Error(`Dev server exited early with code ${code}`));
    });
  });

describe("dev server", () => {
  it("starts with repo defaults", async () => {
    rmSync(path.join(webDir, ".next"), { recursive: true, force: true });
    const child: ChildProcessWithoutNullStreams = spawn("pnpm", ["dev"], {
      cwd: webDir,
      env: buildEnv(),
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });

    const exitPromise = new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
    });

    try {
      await waitForReady(child);
    } finally {
      // Kill the entire process group (pnpm + next-server + webpack-loaders)
      // to prevent orphaned processes from blocking port 3001
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch (error) {
          if (!(error instanceof Error && /ESRCH/.test(error.message))) {
            console.warn("Failed to stop dev server", error);
          }
        }
      }
      await exitPromise;
      rmSync(path.join(webDir, ".next", "dev", "lock"), { force: true });
    }

    expect(child.exitCode !== null || child.signalCode !== null).toBe(true);
  }, 120000);
});
