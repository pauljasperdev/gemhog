import { env } from "@gemhog/env/server";
import { defineConfig } from "drizzle-kit";
import { Redacted } from "effect";

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Redacted.value(env.DATABASE_URL),
  },
});
