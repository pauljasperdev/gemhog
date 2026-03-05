import { migrate } from "@gemhog/db/migrate";
import { Resource } from "sst";

await migrate(Resource.DatabaseUrl.value);
