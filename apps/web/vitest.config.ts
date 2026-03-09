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
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["**/*.int.test.ts", "**/*.int.test.tsx"],
  },
});
