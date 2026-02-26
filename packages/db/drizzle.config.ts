import { runtimeEnv } from "@gemhog/env/runtime";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/auth.sql.ts",
    "./src/podcast.sql.ts",
    "./src/subscriber.sql.ts",
  ],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: runtimeEnv.DATABASE_URL,
  },
});
