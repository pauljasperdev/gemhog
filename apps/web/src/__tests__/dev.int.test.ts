import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const webDir = path.resolve(__dirname, "../..");
const buildEnv = (): NodeJS.ProcessEnv => {
  return {
    ...process.env,
    LOCAL_ENV: "1",
    NODE_ENV: "development",
  };
};

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
) =>
  Promise.race([
    fetch(url, init),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeoutMs),
    ),
  ]);

const assertSubscribeWorks = async (baseUrl: string) => {
  const email = `dev-${Date.now()}@example.com`;
  const url = `${baseUrl}/api/trpc/subscriber.subscribe?batch=1`;
  const body = JSON.stringify({
    0: {
      json: {
        email,
      },
    },
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body,
        },
        60_000,
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const payload = (await response.json()) as {
        0?: { result?: { data?: { json?: { message?: string } } } };
      };
      const result = payload?.[0]?.result?.data;
      const message = result?.json?.message;
      if (!message) {
        throw new Error(
          `Missing tRPC response data: ${JSON.stringify(payload)}`,
        );
      }
      return;
    } catch (error) {
      if (attempt === 2) {
        throw new Error(`tRPC subscribe failed: ${String(error)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
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
      detached: true,
    });

    const exitPromise = new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
    });

    try {
      await waitForReady(child);
      await assertSubscribeWorks("http://localhost:3001");
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
