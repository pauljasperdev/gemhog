import { Context, Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

vi.mock("@gemhog/env/server", () => {
  const ServerEnvService = Context.GenericTag<{
    BETTER_AUTH_SECRET: string;
    DATABASE_URL: string;
    DATABASE_URL_POOLER: string;
    BETTER_AUTH_URL: string;
    APP_URL: string;
    GOOGLE_GENERATIVE_AI_API_KEY: string;
    RESEND_API_KEY: string;
    SENTRY_DSN: string;
  }>("ServerEnvService");
  return { ServerEnvService, ServerEnvLive: Layer.empty };
});

import { ServerEnvService } from "@gemhog/env/server";
import { InvalidTokenError } from "../email.errors";
import { createToken, verifyToken } from "../token";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

const stubEnv = (secret: string) =>
  Layer.succeed(ServerEnvService, {
    BETTER_AUTH_SECRET: secret,
    DATABASE_URL: "",
    DATABASE_URL_POOLER: "",
    BETTER_AUTH_URL: "",
    APP_URL: "",
    GOOGLE_GENERATIVE_AI_API_KEY: "",
    RESEND_API_KEY: "",
    SENTRY_DSN: "",
  });

const TestEnv = stubEnv(TEST_SECRET);

describe("token", () => {
  describe("createToken", () => {
    it("should return a base64url-encoded string", async () => {
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }).pipe(Effect.provide(TestEnv)),
      );

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should create tokens with action "verify"', async () => {
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }).pipe(Effect.provide(TestEnv)),
      );

      expect(token).toBeTruthy();
    });

    it('should create tokens with action "unsubscribe"', async () => {
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "unsubscribe",
          expiresAt: Date.now() + 60_000,
        }).pipe(Effect.provide(TestEnv)),
      );

      expect(token).toBeTruthy();
    });
  });

  describe("verifyToken", () => {
    it("should return the original payload for a valid token", async () => {
      const expiresAt = Date.now() + 60_000;
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt,
        }).pipe(Effect.provide(TestEnv)),
      );

      const result = await Effect.runPromise(
        verifyToken(token).pipe(Effect.provide(TestEnv)),
      );

      expect(result).toEqual({
        email: "user@example.com",
        action: "verify",
        expiresAt,
      });
    });

    it("should fail with expired reason for an expired token", async () => {
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() - 1000,
        }).pipe(Effect.provide(TestEnv)),
      );

      const result = await Effect.runPromise(
        verifyToken(token).pipe(Effect.provide(TestEnv), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.reason).toBe("expired");
      }
    });

    it("should fail with invalid_signature for a tampered token", async () => {
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }).pipe(Effect.provide(TestEnv)),
      );

      const tampered = `X${token.slice(1)}`;

      const result = await Effect.runPromise(
        verifyToken(tampered).pipe(Effect.provide(TestEnv), Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
      }
    });

    it("should fail for malformed/garbage input", async () => {
      for (const input of ["not-a-real-token", "", "abcdef"]) {
        const result = await Effect.runPromise(
          verifyToken(input).pipe(Effect.provide(TestEnv), Effect.either),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(InvalidTokenError);
        }
      }
    });

    it("should produce different tokens for same payload with different secrets", async () => {
      const payload = {
        email: "user@example.com",
        action: "verify" as const,
        expiresAt: Date.now() + 60_000,
      };

      const token1 = await Effect.runPromise(
        createToken(payload).pipe(Effect.provide(TestEnv)),
      );
      const token2 = await Effect.runPromise(
        createToken(payload).pipe(
          Effect.provide(
            stubEnv("different-secret-at-least-32-characters-long"),
          ),
        ),
      );

      expect(token1).not.toBe(token2);
    });

    it("should fail for a token signed with a different secret", async () => {
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }).pipe(Effect.provide(TestEnv)),
      );

      const result = await Effect.runPromise(
        verifyToken(token).pipe(
          Effect.provide(stubEnv("wrong-secret-at-least-32-characters-long")),
          Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        expect(result.left.reason).toBe("invalid_signature");
      }
    });
  });

  describe("roundtrip", () => {
    it("should roundtrip: create -> verify returns matching email and action", async () => {
      const email = "roundtrip@example.com";
      const action = "unsubscribe" as const;
      const expiresAt = Date.now() + 3600_000;

      const token = await Effect.runPromise(
        createToken({ email, action, expiresAt }).pipe(Effect.provide(TestEnv)),
      );
      const result = await Effect.runPromise(
        verifyToken(token).pipe(Effect.provide(TestEnv)),
      );

      expect(result.email).toBe(email);
      expect(result.action).toBe(action);
      expect(result.expiresAt).toBe(expiresAt);
    });
  });
});
