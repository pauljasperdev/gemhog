// Test fixtures for auth integration tests

import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Truncate all auth-related tables before each test.
 * Preserves __drizzle_migrations table.
 *
 * Tables are truncated with CASCADE to handle foreign key dependencies.
 */
export async function truncateAuthTables(
  db: NodePgDatabase<Record<string, unknown>>,
): Promise<void> {
  // Truncate all auth tables in one statement with CASCADE
  // Order doesn't matter when using CASCADE
  await db.execute(
    sql`TRUNCATE TABLE session, account, verification, "user" CASCADE`,
  );
}

/**
 * Test user input for signup operations.
 */
export interface TestUserInput {
  email: string;
  password: string;
  name: string;
}

/**
 * Create test user data for signup.
 * Does NOT insert into database - just creates the input data object.
 *
 * @param overrides - Optional overrides for default values
 * @returns Test user data ready for signup API
 */
export function createTestUser(
  overrides?: Partial<TestUserInput>,
): TestUserInput {
  return {
    email: overrides?.email ?? `test-${Date.now()}@example.com`,
    password: overrides?.password ?? "password123",
    name: overrides?.name ?? "Test User",
  };
}
