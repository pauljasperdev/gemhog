import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// drizzle-kit only needs DATABASE_URL for migrations
// Using dotenv directly instead of @gemhog/env/server which validates all env vars
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it in .env or environment variables.",
  );
}

export default defineConfig({
  schema: "./src/*/*.sql.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
