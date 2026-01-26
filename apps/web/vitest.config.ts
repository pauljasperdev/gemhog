import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: "web",
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "app/**/*.test.ts"],
  },
});
