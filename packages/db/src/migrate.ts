import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as drizzleMigrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

export async function migrate(databaseUrl: string): Promise<void> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const db = drizzle(client);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  await drizzleMigrate(db, {
    migrationsFolder: path.join(__dirname, "../migrations"),
  });
  await client.end();
  console.log("✓ Migrations applied");
}
