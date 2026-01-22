import { env } from "@gemhog/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./auth.sql";

// Create better-auth instance
const createAuth = () => {
  const db = drizzle(env.DATABASE_URL, { schema });

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: { enabled: true },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
  });
};

// Lazy singleton
let _auth: ReturnType<typeof createAuth> | null = null;
export const getAuth = () => {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
};

// Convenience proxy for backward compatibility
type BetterAuthInstance = ReturnType<typeof betterAuth>;
export const auth = new Proxy({} as BetterAuthInstance, {
  get(_target, prop) {
    return (getAuth() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Plain async helper for getting session
export const getSession = (headers: Headers) =>
  getAuth().api.getSession({ headers });
