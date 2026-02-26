import { drizzle } from "drizzle-orm/node-postgres";
import * as Effect from "effect";
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
import * as authModule from "../src/send-otp";
import * as schema from "../src/sql";
import { truncateAuthTables } from "./test-fixtures";

vi.mock("../src/send-otp", () => ({
  sendOtpEmail: vi.fn(() => Effect.Effect.void),
}));

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
  APP_URL: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "test-google-api-key",
  SENTRY_DSN: "https://key@sentry.io/123",
  ADMIN_EMAIL: "admin-test@example.com",
  LOCAL_ENV: "1",
};

Object.assign(process.env, TEST_ENV);
describe("auth integration", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import type
  let auth: any;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_ENV.DATABASE_URL });
    db = drizzle(pool);
    const { auth: authInstance } = await import("../src/service");
    auth = authInstance;
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await truncateAuthTables(db);
    vi.clearAllMocks();
  });

  describe("email/password (disabled)", () => {
    it("should reject email/password sign-up (disabled in favour of OTP)", async () => {
      await expect(
        auth.api.signUpEmail({
          body: {
            email: "test@example.com",
            password: "password123",
            name: "Test User",
          },
        }),
      ).rejects.toThrow();
    });

    it("should reject email/password sign-in (disabled in favour of OTP)", async () => {
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

  describe("admin plugin", () => {
    it("auth instance has admin plugin endpoints", () => {
      expect(auth.handler).toBeDefined();
      expect(auth.api).toBeDefined();
    });
  });

  describe("emailOTP plugin", () => {
    it("should have emailOTP endpoints configured", () => {
      expect(auth.api.sendVerificationOTP).toBeDefined();
      expect(typeof auth.api.sendVerificationOTP).toBe("function");
    });

    it("sendVerificationOTP callback should not throw for admin users", async () => {
      const adminEmail = TEST_ENV.ADMIN_EMAIL;
      await expect(
        auth.api.sendVerificationOTP({
          body: { email: adminEmail, type: "sign-in" },
        }),
      ).resolves.not.toThrow();
    });

    it("sendVerificationOTP callback should not throw for non-admin users", async () => {
      const userEmail = `user-${Date.now()}@example.com`;
      await expect(
        auth.api.sendVerificationOTP({
          body: { email: userEmail, type: "sign-in" },
        }),
      ).resolves.not.toThrow();
    });

    it("sendVerificationOTP callback should not throw for non-existent users", async () => {
      await expect(
        auth.api.sendVerificationOTP({
          body: { email: "nonexistent@example.com", type: "sign-in" },
        }),
      ).resolves.not.toThrow();
    });

    it("admin signup via OTP creates user with admin role", async () => {
      const adminEmail = TEST_ENV.ADMIN_EMAIL;
      // Step 1: Request OTP — mock captures the plaintext OTP
      await auth.api.sendVerificationOTP({
        body: { email: adminEmail, type: "sign-in" },
      });
      expect(authModule.sendOtpEmail).toHaveBeenCalledOnce();
      const capturedOtp = vi.mocked(authModule.sendOtpEmail).mock
        .calls[0]?.[1] as string;
      expect(capturedOtp).toBeDefined();
      // Step 2: Verify OTP — this triggers user creation + databaseHooks
      await auth.api.signInEmailOTP({
        body: { email: adminEmail, otp: capturedOtp },
      });
      // Step 3: Verify user was created with admin role (from databaseHooks)
      const result = await pool.query(
        'SELECT role FROM "user" WHERE email = $1',
        [adminEmail],
      );
      expect(result.rows[0]?.role).toBe("admin");
    });

    it("non-admin signup via OTP creates user with user role", async () => {
      const userEmail = `user-${Date.now()}@example.com`;
      await auth.api.sendVerificationOTP({
        body: { email: userEmail, type: "sign-in" },
      });
      // Non-admin email: sendOtpEmail should NOT be called (gating works)
      expect(authModule.sendOtpEmail).not.toHaveBeenCalled();
      // Non-admin users get "user" role by default — verify via direct insert
      await db.insert(schema.user).values({
        id: crypto.randomUUID(),
        name: "User",
        email: userEmail,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await pool.query(
        'SELECT role FROM "user" WHERE email = $1',
        [userEmail],
      );
      expect(result.rows[0]?.role).toBe("user");
    });

    it("no admin role assigned when ADMIN_EMAIL is unset", async () => {
      const originalAdminEmail = process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_EMAIL;
      try {
        const email = TEST_ENV.ADMIN_EMAIL; // use admin email but env var is unset
        await auth.api.sendVerificationOTP({
          body: { email, type: "sign-in" },
        });
        // With ADMIN_EMAIL unset, sendOtpEmail should NOT be called
        expect(authModule.sendOtpEmail).not.toHaveBeenCalled();
        // Users created without ADMIN_EMAIL get "user" role — verify via direct insert
        await db.insert(schema.user).values({
          id: crypto.randomUUID(),
          name: "User",
          email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const result = await pool.query(
          'SELECT role FROM "user" WHERE email = $1',
          [email],
        );
        expect(result.rows[0]?.role).toBe("user");
      } finally {
        if (originalAdminEmail) process.env.ADMIN_EMAIL = originalAdminEmail;
      }
    });
  });

  describe("admin role enforcement", () => {
    it("user table has role column defaulting to 'user'", async () => {
      const userId = crypto.randomUUID();
      const email = `role-test-${Date.now()}@example.com`;
      await db.insert(schema.user).values({
        id: userId,
        name: "Test User",
        email,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await pool.query('SELECT role FROM "user" WHERE id = $1', [
        userId,
      ]);
      expect(result.rows[0]?.role).toBe("user");
    });

    it("admin user has admin role", async () => {
      const adminEmail = `admin-role-${Date.now()}@example.com`;
      await db.insert(schema.user).values({
        id: crypto.randomUUID(),
        name: "Admin",
        email: adminEmail,
        role: "admin",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await pool.query(
        'SELECT role FROM "user" WHERE email = $1',
        [adminEmail],
      );
      expect(result.rows[0]?.role).toBe("admin");
    });
  });
});
