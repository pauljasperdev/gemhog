import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["**/src/**"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
  },
});
