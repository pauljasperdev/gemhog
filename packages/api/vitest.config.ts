import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/api",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
