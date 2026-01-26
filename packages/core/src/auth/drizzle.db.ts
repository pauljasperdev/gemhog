import { env } from "@gemhog/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./auth.sql";

export const db = drizzle(env.DATABASE_URL, { schema });
