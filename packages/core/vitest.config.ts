// packages/core/vitest.config.ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/core",
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/*.int.test.ts"],
  },
});
