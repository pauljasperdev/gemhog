// test/integration-setup.ts
// Shared setup for all integration tests across the monorepo
import { execSync } from "node:child_process";
import path from "node:path";

export async function setup() {
  const dbUrl = process.env.DATABASE_URL || "";

  // Skip Docker setup if using external database (Test-stage AWS)
  if (dbUrl && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
    console.log("[integration] Using external database, skipping Docker setup");
    return;
  }

  // Start PostgreSQL via existing db:start script, wait for health check
  const dockerDir = path.join(process.cwd(), "packages", "db");
  console.log("[integration] Starting PostgreSQL...");
  execSync("docker compose up -d --wait", { cwd: dockerDir, stdio: "inherit" });
  console.log("[integration] PostgreSQL ready");
}

export async function teardown() {
  // Don't stop the container - developers may want it running for db:studio
  // Cleanup is manual via `pnpm db:stop` or `pnpm db:down`
}
