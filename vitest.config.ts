import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    // Exclude integration tests from unit test runs
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.int.test.ts", // Integration tests have their own config
    ],
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
        "**/*.int.test.ts",
      ],
    },
  },
});
