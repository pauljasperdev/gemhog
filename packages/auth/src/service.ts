import "@gemhog/env/server";
import { instrumentBetterAuth } from "@kubiks/otel-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import * as Effect from "effect";
import { db } from "./drizzle.db";
import { sendOtpEmail } from "./send-otp";
import * as schema from "./sql";

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const ALLOW_SIGNUP = false;

if (!BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required");
}

const trustedOrigins = [
  process.env.APP_URL,
  process.env.BETTER_AUTH_URL,
].filter((origin): origin is string => Boolean(origin));

const unwrappedAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: false,
  },
  secret: BETTER_AUTH_SECRET,
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
          if (adminEmail && user.email.toLowerCase().trim() === adminEmail) {
            return { data: { role: "admin" } };
          }
        },
      },
    },
  },
  plugins: [
    admin(),
    emailOTP({
      disableSignUp: false,
      storeOTP: "hashed",
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return;

        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const isAdmin = adminEmail && email.toLowerCase().trim() === adminEmail;

        if (!isAdmin && !ALLOW_SIGNUP) return;

        await Effect.Effect.runPromise(sendOtpEmail(email, otp));
      },
    }),
  ],
});

export const auth = instrumentBetterAuth(
  unwrappedAuth as unknown as Parameters<typeof instrumentBetterAuth>[0],
  { tracerName: "gemhog-auth" },
) as unknown as typeof unwrappedAuth;

export type Session = typeof auth.$Infer.Session;

export const getSession = (headers: Headers) =>
  auth.api.getSession({ headers });
