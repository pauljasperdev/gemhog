import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/env",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
