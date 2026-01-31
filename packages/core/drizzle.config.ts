import { serverEnv } from "@gemhog/env/server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
});
