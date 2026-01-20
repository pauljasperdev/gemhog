// packages/core/vitest.config.ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/core",
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Note: int.test.ts and e2e.test.ts excludes are handled by root config
  },
});
