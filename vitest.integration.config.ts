// vitest.integration.config.ts
// Dedicated config for integration tests across the monorepo
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    environment: "node",
    // Discover all *.integration.test.ts files across monorepo
    include: [
      "apps/**/src/**/*.integration.test.ts",
      "packages/**/src/**/*.integration.test.ts",
    ],
    // Exclude node_modules and dist
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Shared globalSetup handles Docker for all integration tests
    globalSetup: ["./test/integration-setup.ts"],
    // Timeouts for Docker startup and DB operations
    hookTimeout: 60000, // 60s for Docker startup
    testTimeout: 10000, // 10s per test (DB operations can be slow)
    // Run integration tests sequentially to avoid DB conflicts (Vitest 4 format)
    isolate: false, // Single process for DB consistency
    fileParallelism: false, // Run test files sequentially
  },
});
