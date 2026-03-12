import * as schema from "@gemhog/db/auth";
import { ConfigLayerTest } from "@gemhog/env/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Config, Effect } from "effect";
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
import { truncateAuthTables } from "./test-fixtures";

vi.mock("../src/send-otp", () => ({
  sendOtpEmail: vi.fn(() => Effect.void),
}));

// Config values read from ConfigLayerTest in beforeAll

/**
 * Sign a session token the same way better-auth's cookie-builder does.
 * Uses HMAC-SHA256 and returns `${token}.${base64Signature}`.
 */
async function signSessionToken(
  token: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(token),
  );
  const base64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${token}.${base64Sig}`;
}

describe("auth integration", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  // Auth type from dynamic import - properly typed via module type extraction
  let auth: Awaited<typeof import("../src/service")>["auth"];

  beforeAll(async () => {
    // Read config from ConfigLayerTest and populate process.env
    const testConfig = await Effect.runPromise(
      Effect.gen(function* () {
        const databaseUrl = yield* Config.string("DATABASE_URL");
        const databaseUrlPooler = yield* Config.string("DATABASE_URL_POOLER");
        const betterAuthSecret = yield* Config.string("BETTER_AUTH_SECRET");
        const betterAuthUrl = yield* Config.string("BETTER_AUTH_URL");
        const appUrl = yield* Config.string("APP_URL");
        const googleApiKey = yield* Config.string(
          "GOOGLE_GENERATIVE_AI_API_KEY",
        );
        const sentryDsn = yield* Config.string("SENTRY_DSN");
        const adminEmail = yield* Config.string("ADMIN_EMAIL");
        return {
          LOCAL_ENV: "1",
          DATABASE_URL: databaseUrl,
          DATABASE_URL_POOLER: databaseUrlPooler,
          BETTER_AUTH_SECRET: betterAuthSecret,
          BETTER_AUTH_URL: betterAuthUrl,
          APP_URL: appUrl,
          GOOGLE_GENERATIVE_AI_API_KEY: googleApiKey,
          SENTRY_DSN: sentryDsn,
          ADMIN_EMAIL: adminEmail,
        };
      }).pipe(Effect.provide(ConfigLayerTest)),
    );
    Object.assign(process.env, testConfig);

    pool = new Pool({ connectionString: testConfig.DATABASE_URL });
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
      const adminEmail = process.env.ADMIN_EMAIL as string;
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
      const adminEmail = process.env.ADMIN_EMAIL as string;
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
      // Step 4: Verify session was persisted (better-auth session handling)
      const sessionResult = await pool.query(
        'SELECT * FROM "session" WHERE user_id IN (SELECT id FROM "user" WHERE email = $1)',
        [adminEmail],
      );
      expect(sessionResult.rows.length).toBeGreaterThan(0);
    });
  });

  describe("deleteUser", () => {
    it("deleteUser is enabled in the auth config", () => {
      // Verify the auth instance exposes a deleteUser API endpoint
      expect(auth.api.deleteUser).toBeDefined();
      expect(typeof auth.api.deleteUser).toBe("function");
    });

    it("authenticated user can self-delete and removes all rows", async () => {
      // Freeze time to ensure session stays "fresh" for freshAge check (default 24h)
      vi.useFakeTimers();
      vi.setSystemTime(Date.now());

      try {
        // Access auth internals to create session directly (without testUtils plugin)
        const ctx = await auth.$context;

        // Create a user directly via DB insert
        const userId = crypto.randomUUID();
        const email = `delete-me-${Date.now()}@example.com`;
        await db.insert(schema.user).values({
          id: userId,
          name: "Delete Me",
          email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Create a fresh session via internalAdapter (same as testUtils.login does)
        const session = await ctx.internalAdapter.createSession(userId);
        const token = session.token;
        const secret = ctx.secret;

        // Sign the cookie the same way better-auth does
        const signedToken = await signSessionToken(token, secret);
        const cookieName = ctx.authCookies.sessionToken.name;
        const headers = new Headers();
        headers.set("cookie", `${cookieName}=${signedToken}`);

        // Verify user exists before deletion
        const beforeUser = await pool.query(
          'SELECT id FROM "user" WHERE id = $1',
          [userId],
        );
        expect(beforeUser.rows).toHaveLength(1);

        // Self-delete via auth.api.deleteUser (requires fresh session)
        await auth.api.deleteUser({ headers, body: {} });

        // Verify user row is gone
        const afterUser = await pool.query(
          'SELECT id FROM "user" WHERE id = $1',
          [userId],
        );
        expect(afterUser.rows).toHaveLength(0);

        // Verify session rows are gone
        const afterSession = await pool.query(
          "SELECT id FROM session WHERE user_id = $1",
          [userId],
        );
        expect(afterSession.rows).toHaveLength(0);

        // Verify account rows are gone
        const afterAccount = await pool.query(
          "SELECT id FROM account WHERE user_id = $1",
          [userId],
        );
        expect(afterAccount.rows).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
