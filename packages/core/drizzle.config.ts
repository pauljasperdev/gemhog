import { env } from "@gemhog/env/server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
