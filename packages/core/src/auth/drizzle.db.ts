import "@gemhog/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./sql";

const DATABASE_URL_POOLER = process.env.DATABASE_URL_POOLER;

if (!DATABASE_URL_POOLER) {
  throw new Error("DATABASE_URL_POOLER is required");
}

export const db = drizzle(DATABASE_URL_POOLER, { schema });
