import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: "web",
    environment: "happy-dom",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
    ],
    exclude: [
      "**/*.int.test.ts",
      "**/*.int.test.tsx",
      "**/*.e2e.test.ts",
      "**/*.e2e.test.tsx",
    ],
  },
});
