import "@gemhog/env/server";
import * as schema from "@gemhog/db/auth";
import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL_POOLER = process.env.DATABASE_URL_POOLER;

if (!DATABASE_URL_POOLER) {
  throw new Error("DATABASE_URL_POOLER is required");
}

export const db = drizzle(DATABASE_URL_POOLER, { schema });
