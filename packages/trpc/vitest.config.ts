import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/trpc",
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["**/*.int.test.ts"],
  },
});
