import { env } from "@gemhog/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.server.DATABASE_URL,
  },
});
