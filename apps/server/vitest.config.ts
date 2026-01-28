import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "server",
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/*.int.test.ts", "**/*.e2e.test.ts"],
  },
});
