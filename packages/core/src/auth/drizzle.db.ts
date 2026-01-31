import { serverEnv } from "@gemhog/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./auth.sql";

export const db = drizzle(serverEnv.DATABASE_URL, { schema });
