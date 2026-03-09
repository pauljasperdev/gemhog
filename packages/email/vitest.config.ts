// packages/email/vitest.config.ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/email",
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["**/*.int.test.ts"],
  },
});
