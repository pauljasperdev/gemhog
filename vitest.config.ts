import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "apps/*",
      "packages/*",
      // Exclude db package - it has globalSetup for Docker and is configured separately
      "!packages/db",
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
      ],
    },
  },
});
