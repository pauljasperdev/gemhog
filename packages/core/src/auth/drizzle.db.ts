import "@gemhog/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./auth.sql";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const db = drizzle(DATABASE_URL, { schema });
