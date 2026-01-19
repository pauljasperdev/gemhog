// packages/db/vitest.config.ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/db",
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/*.integration.test.ts"],
    // No globalSetup needed - integration tests use vitest.integration.config.ts
  },
});
