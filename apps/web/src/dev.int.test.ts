import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { describe, expect, it } from "vitest";

const webDir = path.resolve(__dirname, "..");
const envExample = dotenv.parse(
  readFileSync(path.join(webDir, ".env.example")),
);
const buildEnv = (): NodeJS.ProcessEnv => {
  return {
    ...process.env,
    ...envExample,
    NODE_ENV: "development",
    PORT: "3015",
  };
};

const waitForReady = (child: ReturnType<typeof spawn>) =>
  new Promise<void>((resolve, reject) => {
    let settled = false;
    let output = "";

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
        resolve();
      }
    };

    const onData = (data: Buffer) => {
      output += data.toString();
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
    });

    const exitPromise = new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
    });

    try {
      await waitForReady(child);
    } finally {
      child.kill("SIGTERM");
      await exitPromise;
      rmSync(path.join(webDir, ".next", "dev", "lock"), { force: true });
    }

    expect(child.killed).toBe(true);
  }, 45000);
});
