// packages/db/vitest.config.ts
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    name: "@gemhog/db",
    root: __dirname,
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    hookTimeout: 60000, // 60s for Docker startup
    testTimeout: 10000, // 10s per test (DB operations can be slow)
  },
});
