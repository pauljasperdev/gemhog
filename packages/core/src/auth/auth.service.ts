import { env } from "@gemhog/env/server";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer } from "effect";
import { AuthError } from "./auth.errors";
import * as schema from "./auth.sql";

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
  const db = drizzle(env.DATABASE_URL, { schema });
  const polarClient = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
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
  const auth = createAuth();
  return {
    getSession: (headers) =>
      Effect.tryPromise({
        try: () => auth.api.getSession({ headers }),
        catch: (error) =>
          new AuthError({ message: "Failed to get session", cause: error }),
      }),
    handler: (request) => auth.handler(request),
  };
});

// Export the raw auth instance for backward compatibility during migration
// This will be used by apps/server until full Effect adoption
export const auth = createAuth();
