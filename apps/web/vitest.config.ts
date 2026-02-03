import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineProject({
  plugins: [
    tsconfigPaths({
      root: rootDir,
      projects: ["./tsconfig.json"],
    }) as { name: string },
  ],
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
