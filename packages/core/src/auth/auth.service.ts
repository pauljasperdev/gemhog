import type { ServerEnv } from "@gemhog/env/server";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Redacted } from "effect";
import * as schema from "./auth.sql";

// Deferred env import - validates when createAuth() is called, not at module load
// This allows unit tests to import auth module without triggering env validation
const getEnv = (): ServerEnv =>
  (require("@gemhog/env/server") as { env: ServerEnv }).env;

// Create better-auth instance
const createAuth = () => {
  const env = getEnv();
  const db = drizzle(Redacted.value(env.DATABASE_URL), { schema });
  const polarClient = new Polar({
    accessToken: Redacted.value(env.POLAR_ACCESS_TOKEN),
    server: "sandbox",
  });

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
    plugins: [
      polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        enableCustomerPortal: true,
        use: [
          checkout({
            products: [{ productId: "your-product-id", slug: "pro" }],
            successUrl: env.POLAR_SUCCESS_URL,
            authenticatedUsersOnly: true,
          }),
          portal(),
        ],
      }),
    ],
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
