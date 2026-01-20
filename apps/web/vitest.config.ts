import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "web",
    environment: "happy-dom",
    // Includes both src/ and app/ directories (Next.js App Router structure)
    include: ["src/**/*.test.ts", "app/**/*.test.ts"],
  },
});
