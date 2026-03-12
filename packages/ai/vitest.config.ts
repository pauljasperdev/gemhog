import { fileURLToPath } from "node:url";
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "@gemhog/ai",
    environment: "node",
    root: fileURLToPath(new URL(".", import.meta.url)),
    include: ["tests/**/*.test.ts"],
    exclude: ["**/*.int.test.ts"],
  },
});
