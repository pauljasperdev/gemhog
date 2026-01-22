// packages/core/src/auth/auth.int.test.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createTestUser, truncateAuthTables } from "./test-fixtures";

// Test environment values for better-auth
const TEST_ENV = {
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:password@localhost:5432/gemhog",
  DATABASE_URL_POOLER:
    process.env.DATABASE_URL_POOLER ??
    process.env.DATABASE_URL ??
    "postgresql://postgres:password@localhost:5432/gemhog",
  BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3000",
  CORS_ORIGIN: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "test-google-api-key",
  NODE_ENV: "test" as const,
};

// Mock @gemhog/env/server to provide test env values
vi.mock("@gemhog/env/server", () => ({
  env: TEST_ENV,
}));

/**
 * Auth flow integration tests.
 *
 * Tests real authentication flows against the database via better-auth API.
 * Each test runs with a fresh database state (tables truncated before each test).
 *
 * Note: Password hashing adds ~100-150ms per signup, making these tests
 * slower than unit tests. This is expected for integration tests.
 */
describe("auth integration", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import type
  let auth: any;

  beforeAll(async () => {
    // Use the same database URL as auth service
    pool = new Pool({ connectionString: TEST_ENV.DATABASE_URL });
    db = drizzle(pool);

    // Dynamic import after mock is set up
    const { getAuth } = await import("./auth.service");
    auth = getAuth();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean slate for each test
    await truncateAuthTables(db);
  });

  describe("signup", () => {
    it("should create user via email/password", async () => {
      const testUser = createTestUser();

      const result = await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      // Verify user was created
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.name).toBe(testUser.name);

      // Verify token was created (better-auth returns { token, user })
      expect(result.token).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      const testUser = createTestUser({
        email: "duplicate@example.com",
      });

      // First signup should succeed
      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      // Second signup with same email should fail
      await expect(
        auth.api.signUpEmail({
          body: {
            email: testUser.email,
            password: testUser.password,
            name: testUser.name,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("signin", () => {
    it("should authenticate valid credentials", async () => {
      const testUser = createTestUser();

      // First signup
      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      // Then signin
      const result = await auth.api.signInEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      // Verify token was created (better-auth returns { token, user })
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
    });

    it("should reject invalid password", async () => {
      const testUser = createTestUser();

      // First signup
      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      // Try signin with wrong password
      await expect(
        auth.api.signInEmail({
          body: {
            email: testUser.email,
            password: "wrong-password",
          },
        }),
      ).rejects.toThrow();
    });

    it("should reject non-existent user", async () => {
      // Try signin without signup
      await expect(
        auth.api.signInEmail({
          body: {
            email: "nonexistent@example.com",
            password: "password123",
          },
        }),
      ).rejects.toThrow();
    });
  });
});
