import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Truncate the subscriber table before each test.
 * Preserves __drizzle_migrations table.
 */
export async function truncateSubscriberTable(
  db: NodePgDatabase<Record<string, unknown>>,
): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE subscriber CASCADE`);
}

/**
 * Test subscriber input for creating subscribers.
 */
export interface TestSubscriberInput {
  email: string;
}

/**
 * Create test subscriber data.
 * Does NOT insert into database - just creates the input data object.
 */
export function createTestSubscriber(
  overrides?: Partial<TestSubscriberInput>,
): TestSubscriberInput {
  return {
    email: overrides?.email ?? `test-${Date.now()}@example.com`,
  };
}
