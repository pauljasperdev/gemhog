import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/auth",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
