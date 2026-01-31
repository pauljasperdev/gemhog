import { env } from "@gemhog/env";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./auth.sql";

export const db = drizzle(env.server.DATABASE_URL, { schema });
