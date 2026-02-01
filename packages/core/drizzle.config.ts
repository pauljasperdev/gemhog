import { runtimeEnv } from "@gemhog/env/runtime";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: runtimeEnv.DATABASE_URL,
  },
});
