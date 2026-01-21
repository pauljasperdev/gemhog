import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load env vars from apps/server/.env for drizzle-kit migrations
// Note: Using dotenv directly instead of @gemhog/env because drizzle-kit
// only needs DATABASE_URL, but @gemhog/env validates ALL server env vars
dotenv.config({
  path: "../../apps/server/.env",
});

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
