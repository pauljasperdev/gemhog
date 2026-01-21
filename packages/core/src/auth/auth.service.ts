import type { ServerEnv } from "@gemhog/env/server";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer, Redacted } from "effect";
import { AuthError } from "./auth.errors";
import * as schema from "./auth.sql";

// Deferred env import - validates when createAuth() is called, not at module load
// This allows unit tests to import AuthService without triggering env validation
const getEnv = (): ServerEnv =>
  (require("@gemhog/env/server") as { env: ServerEnv }).env;

// Types
type Session = Awaited<
  ReturnType<ReturnType<typeof betterAuth>["api"]["getSession"]>
>;

// Service interface
interface AuthServiceInterface {
  readonly getSession: (headers: Headers) => Effect.Effect<Session, AuthError>;
  readonly handler: (request: Request) => Promise<Response>;
}

// Service tag
export class AuthService extends Context.Tag("@gemhog/core/AuthService")<
  AuthService,
  AuthServiceInterface
>() {}

// Create better-auth instance (internal)
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

// Implementation layer
export const AuthLive = Layer.sync(AuthService, () => {
  const authInstance = createAuth();
  return {
    getSession: (headers) =>
      Effect.tryPromise({
        try: () => authInstance.api.getSession({ headers }),
        catch: (error) =>
          new AuthError({ message: "Failed to get session", cause: error }),
      }),
    handler: (request) => authInstance.handler(request),
  };
});

// Lazy getter for auth instance - backward compatibility
// Used by apps/server until full Effect adoption
// Returns the same auth instance on subsequent calls
let _authInstance: ReturnType<typeof createAuth> | null = null;
export const getAuth = () => {
  if (!_authInstance) {
    _authInstance = createAuth();
  }
  return _authInstance;
};

// For backward compatibility with existing imports
// Note: This will trigger env validation when accessed
type BetterAuthInstance = ReturnType<typeof betterAuth>;
export const auth = new Proxy({} as BetterAuthInstance, {
  get(_target, prop) {
    return (getAuth() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
