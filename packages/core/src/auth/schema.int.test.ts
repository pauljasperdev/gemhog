// packages/core/src/auth/schema.int.test.ts

/**
 * Schema CRUD integration tests.
 *
 * Tests the drizzle schema definitions directly via typed CRUD operations.
 * This verifies the schema works correctly independent of better-auth.
 *
 * Uses direct drizzle API (not Effect) because we're testing the schema
 * definitions themselves. The connection.int.test.ts already tests the
 * Effect SQL layer.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { account, session, user, verification } from "./auth.sql";
import { truncateAuthTables } from "./test-fixtures";

describe("schema CRUD", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  const DATABASE_URL =
    process.env.DATABASE_URL ??
    "postgresql://postgres:password@localhost:5432/gemhog";

  beforeAll(async () => {
    pool = new Pool({ connectionString: DATABASE_URL });
    db = drizzle(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await truncateAuthTables(db);
  });

  describe("user table", () => {
    it("should insert and query user", async () => {
      const testUser = {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert user
      const insertResult = await db.insert(user).values(testUser).returning();
      const inserted = insertResult[0];

      expect(inserted).toBeDefined();
      expect(inserted?.id).toBe(testUser.id);
      expect(inserted?.email).toBe(testUser.email);
      expect(inserted?.name).toBe(testUser.name);
      expect(inserted?.emailVerified).toBe(false);

      // Query user by id
      const queryResult = await db
        .select()
        .from(user)
        .where(eq(user.id, testUser.id));
      const queried = queryResult[0];

      expect(queried).toBeDefined();
      expect(queried?.email).toBe(testUser.email);
      expect(queried?.name).toBe(testUser.name);
    });

    it("should enforce unique email constraint", async () => {
      const testUser1 = {
        id: "user-1",
        email: "duplicate@example.com",
        name: "User 1",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testUser2 = {
        id: "user-2",
        email: "duplicate@example.com", // Same email
        name: "User 2",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First insert should succeed
      await db.insert(user).values(testUser1);

      // Second insert with same email should fail
      await expect(db.insert(user).values(testUser2)).rejects.toThrow();
    });
  });

  describe("session table", () => {
    it("should insert session linked to user", async () => {
      // Create user first
      const testUser = {
        id: "user-for-session",
        email: "session-test@example.com",
        name: "Session Test User",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(user).values(testUser);

      // Create session for user
      const testSession = {
        id: "session-id",
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        token: "test-token",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: testUser.id,
      };

      const insertResult = await db
        .insert(session)
        .values(testSession)
        .returning();
      const inserted = insertResult[0];

      expect(inserted).toBeDefined();
      expect(inserted?.id).toBe(testSession.id);
      expect(inserted?.token).toBe(testSession.token);
      expect(inserted?.userId).toBe(testUser.id);

      // Query session and verify relationship
      const queryResult = await db
        .select()
        .from(session)
        .where(eq(session.userId, testUser.id));
      const queried = queryResult[0];

      expect(queried).toBeDefined();
      expect(queried?.token).toBe(testSession.token);
    });

    it("should enforce foreign key to user", async () => {
      const testSession = {
        id: "orphan-session",
        expiresAt: new Date(Date.now() + 86400000),
        token: "orphan-token",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "nonexistent-user-id", // User doesn't exist
      };

      // Should fail due to foreign key constraint
      await expect(db.insert(session).values(testSession)).rejects.toThrow();
    });
  });

  describe("account table", () => {
    it("should insert account linked to user", async () => {
      // Create user first
      const testUser = {
        id: "user-for-account",
        email: "account-test@example.com",
        name: "Account Test User",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(user).values(testUser);

      // Create account for user
      const testAccount = {
        id: "account-id",
        accountId: "provider-account-id",
        providerId: "github",
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await db
        .insert(account)
        .values(testAccount)
        .returning();
      const inserted = insertResult[0];

      expect(inserted).toBeDefined();
      expect(inserted?.id).toBe(testAccount.id);
      expect(inserted?.accountId).toBe(testAccount.accountId);
      expect(inserted?.providerId).toBe(testAccount.providerId);
      expect(inserted?.userId).toBe(testUser.id);
    });

    it("should store provider info correctly", async () => {
      // Create user first
      const testUser = {
        id: "user-for-provider",
        email: "provider-test@example.com",
        name: "Provider Test User",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(user).values(testUser);

      // Create account with full provider info
      const testAccount = {
        id: "provider-account-id",
        accountId: "12345",
        providerId: "google",
        userId: testUser.id,
        accessToken: "access-token-value",
        refreshToken: "refresh-token-value",
        scope: "openid email profile",
        accessTokenExpiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(account).values(testAccount);

      // Query and verify all provider fields
      const queryResult = await db
        .select()
        .from(account)
        .where(eq(account.id, testAccount.id));
      const queried = queryResult[0];

      expect(queried).toBeDefined();
      expect(queried?.providerId).toBe("google");
      expect(queried?.accountId).toBe("12345");
      expect(queried?.accessToken).toBe("access-token-value");
      expect(queried?.refreshToken).toBe("refresh-token-value");
      expect(queried?.scope).toBe("openid email profile");
    });

    it("should enforce foreign key to user", async () => {
      const testAccount = {
        id: "orphan-account",
        accountId: "orphan-provider-id",
        providerId: "github",
        userId: "nonexistent-user-id", // User doesn't exist
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Should fail due to foreign key constraint
      await expect(db.insert(account).values(testAccount)).rejects.toThrow();
    });
  });

  describe("verification table", () => {
    it("should insert and query verification", async () => {
      const testVerification = {
        id: "verification-id",
        identifier: "test@example.com",
        value: "verification-code-123",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await db
        .insert(verification)
        .values(testVerification)
        .returning();
      const inserted = insertResult[0];

      expect(inserted).toBeDefined();
      expect(inserted?.id).toBe(testVerification.id);
      expect(inserted?.identifier).toBe(testVerification.identifier);
      expect(inserted?.value).toBe(testVerification.value);

      // Query by identifier
      const queryResult = await db
        .select()
        .from(verification)
        .where(eq(verification.identifier, testVerification.identifier));
      const queried = queryResult[0];

      expect(queried).toBeDefined();
      expect(queried?.value).toBe(testVerification.value);
    });
  });
});
