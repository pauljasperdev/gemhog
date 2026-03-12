import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/auth.sql.ts",
    "./src/podscan.sql.ts",
    "./src/subscriber.sql.ts",
    "./src/entity.sql.ts",
    "./src/claim.sql.ts",
  ],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:password@localhost:5432/gemhog",
  },
});
