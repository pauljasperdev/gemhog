import "@gemhog/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "./auth.sql";
import { db } from "./drizzle.db";

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

if (!BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required");
}

const trustedOrigins = [
  process.env.APP_URL,
  process.env.BETTER_AUTH_URL,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  secret: BETTER_AUTH_SECRET,
});

export type Session = typeof auth.$Infer.Session;

export const getSession = (headers: Headers) =>
  auth.api.getSession({ headers });
