/**
 * CLI helper: create a Better Auth session directly in the database.
 *
 * Standalone script - does NOT import workspace packages to remain compatible
 * with `node --experimental-strip-types`.
 *
 * Usage:
 *   NODE_ENV=test node --experimental-strip-types create-test-session.ts \
 *     --email user@gemhog.test --role user --state fresh
 *
 * Flags:
 *   --email  <email>         Required.
 *   --role   <role>          Optional. Default: "user".
 *   --state  fresh|stale     Optional. Default: "fresh". Stale backdates by 25h.
 *
 * Output: JSON object with session token and cookie value to stdout.
 */

// Set up env vars with local-dev defaults before any imports
const defaultEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/gemhog",
  DATABASE_URL_POOLER: "postgresql://postgres:password@localhost:5432/gemhog",
  BETTER_AUTH_SECRET: "ZpgIiuzmFRdZ6OSFTJQ1PHqgRLyhnzIe",
  BETTER_AUTH_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "test-key",
  RESEND_API_KEY: "test-key",
  SENTRY_DSN: "https://key@sentry.io/123",
  PODSCAN_API_TOKEN: "test-token",
  PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
  ADMIN_EMAIL: "admin@gemhog.com",
  LOCAL_ENV: "1",
};

for (const [k, v] of Object.entries(defaultEnv)) {
  if (!process.env[k]) process.env[k] = v;
}

import * as crypto from "node:crypto";
import { Pool } from "pg";

function parseArgs(argv: string[]): {
  email: string;
  role: string;
  state: "fresh" | "stale";
} {
  const args = argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  const email = get("--email");
  if (!email) {
    console.error("Error: --email is required");
    process.exit(1);
  }
  const role = get("--role") ?? "user";
  const stateRaw = get("--state") ?? "fresh";
  if (stateRaw !== "fresh" && stateRaw !== "stale") {
    console.error('Error: --state must be "fresh" or "stale"');
    process.exit(1);
  }
  return { email, role, state: stateRaw };
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

async function signSessionToken(
  token: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(token),
  );
  const base64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${token}.${base64Sig}`;
}

export interface TestSession {
  userId: string;
  sessionId: string;
  sessionToken: string;
  signedToken: string;
  cookieName: string;
  email: string;
  role: string;
  state: "fresh" | "stale";
}

export async function createTestSession(opts: {
  email: string;
  role?: string;
  state?: "fresh" | "stale";
  databaseUrl?: string;
  secret?: string;
}): Promise<TestSession> {
  const {
    email,
    role = "user",
    state = "fresh",
    databaseUrl = process.env.DATABASE_URL ??
      "postgresql://postgres:password@localhost:5432/gemhog",
    secret = process.env.BETTER_AUTH_SECRET ??
      "ZpgIiuzmFRdZ6OSFTJQ1PHqgRLyhnzIe",
  } = opts;

  const cookieName = "better-auth.session_token";
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Upsert user
    const existingResult = await pool.query(
      'SELECT id FROM "user" WHERE email = $1',
      [email],
    );

    let userId: string;

    if (existingResult.rows.length > 0) {
      userId = existingResult.rows[0].id as string;
      await pool.query(
        'UPDATE "user" SET role = $1, updated_at = $2 WHERE id = $3',
        [role, new Date(), userId],
      );
    } else {
      userId = globalThis.crypto.randomUUID();
      const name = email.split("@")[0] ?? email;
      await pool.query(
        'INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, name, email, true, role, new Date(), new Date()],
      );
    }

    // Create session directly in DB
    const sessionToken = generateToken();
    const sessionId = globalThis.crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    await pool.query(
      "INSERT INTO session (id, token, user_id, expires_at, ip_address, user_agent, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        sessionId,
        sessionToken,
        userId,
        expiresAt,
        null,
        "create-test-session-cli",
        now,
        now,
      ],
    );

    // Backdate for stale state (>24h freshAge threshold)
    if (state === "stale") {
      const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await pool.query("UPDATE session SET created_at = $1 WHERE id = $2", [
        staleTime,
        sessionId,
      ]);
    }

    // Sign cookie (same HMAC-SHA256 algo as better-auth cookie-builder.ts)
    const signedToken = await signSessionToken(sessionToken, secret);

    return {
      userId,
      sessionId,
      sessionToken,
      signedToken,
      cookieName,
      email,
      role,
      state,
    };
  } finally {
    await pool.end();
  }
}

// CLI entrypoint
async function main(): Promise<void> {
  const { email, role, state } = parseArgs(process.argv);
  const session = await createTestSession({ email, role, state });

  console.log(JSON.stringify(session, null, 2));
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
