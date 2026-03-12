import { defineProject } from "vitest/config";
export default defineProject({
  test: {
    name: "@gemhog/rpc",
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["**/*.int.test.ts"],
  },
});
