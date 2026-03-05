import { localServerEnv } from "@gemhog/env/local-dev";
import { migrate } from "./migrate.js";

await migrate(localServerEnv.DATABASE_URL);
