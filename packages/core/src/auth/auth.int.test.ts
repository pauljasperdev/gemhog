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

vi.mock("@gemhog/env/server", () => ({
  env: TEST_ENV,
}));
describe("auth integration", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import type
  let auth: any;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_ENV.DATABASE_URL });
    db = drizzle(pool);
    const { auth: authInstance } = await import("./auth.service");
    auth = authInstance;
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
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

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.user.name).toBe(testUser.name);
      expect(result.token).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      const testUser = createTestUser({
        email: "duplicate@example.com",
      });

      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

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

      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

      const result = await auth.api.signInEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
    });

    it("should reject invalid password", async () => {
      const testUser = createTestUser();

      await auth.api.signUpEmail({
        body: {
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        },
      });

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
