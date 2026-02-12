import { Effect } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { InvalidTokenError } from "../errors";
import { createToken, verifyToken } from "../token";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

const setSecret = (secret: string) => {
  process.env.BETTER_AUTH_SECRET = secret;
};

beforeEach(() => {
  setSecret(TEST_SECRET);
});

describe("token", () => {
  describe("createToken", () => {
    it("should return a base64url-encoded string", async () => {
      setSecret(TEST_SECRET);
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }),
      );

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should create tokens with action "verify"', async () => {
      setSecret(TEST_SECRET);
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }),
      );

      expect(token).toBeTruthy();
    });

    it('should create tokens with action "unsubscribe"', async () => {
      setSecret(TEST_SECRET);
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "unsubscribe",
          expiresAt: Date.now() + 60_000,
        }),
      );

      expect(token).toBeTruthy();
    });
  });

  describe("verifyToken", () => {
    it("should return the original payload for a valid token", async () => {
      setSecret(TEST_SECRET);
      const expiresAt = Date.now() + 60_000;
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt,
        }),
      );

      const result = await Effect.runPromise(verifyToken(token));

      expect(result).toEqual({
        email: "user@example.com",
        action: "verify",
        expiresAt,
      });
    });

    it("should fail with expired reason for an expired token", async () => {
      setSecret(TEST_SECRET);
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() - 1000,
        }),
      );

      const result = await Effect.runPromise(
        verifyToken(token).pipe(Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        if (result.left._tag === "InvalidTokenError") {
          expect(result.left.reason).toBe("expired");
        }
      }
    });

    it("should fail with invalid_signature for a tampered token", async () => {
      setSecret(TEST_SECRET);
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }),
      );

      const tampered = `X${token.slice(1)}`;

      const result = await Effect.runPromise(
        verifyToken(tampered).pipe(Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
      }
    });

    it("should fail for malformed/garbage input", async () => {
      setSecret(TEST_SECRET);
      for (const input of ["not-a-real-token", "", "abcdef"]) {
        const result = await Effect.runPromise(
          verifyToken(input).pipe(Effect.either),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(InvalidTokenError);
        }
      }
    });

    it("should produce different tokens for same payload with different secrets", async () => {
      setSecret(TEST_SECRET);
      const payload = {
        email: "user@example.com",
        action: "verify" as const,
        expiresAt: Date.now() + 60_000,
      };

      const token1 = await Effect.runPromise(createToken(payload));
      setSecret("different-secret-at-least-32-characters-long");
      const token2 = await Effect.runPromise(createToken(payload));

      expect(token1).not.toBe(token2);
    });

    it("should fail for a token signed with a different secret", async () => {
      setSecret(TEST_SECRET);
      const token = await Effect.runPromise(
        createToken({
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        }),
      );

      setSecret("wrong-secret-at-least-32-characters-long");
      const result = await Effect.runPromise(
        verifyToken(token).pipe(Effect.either),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(InvalidTokenError);
        if (result.left._tag === "InvalidTokenError") {
          expect(result.left.reason).toBe("invalid_signature");
        }
      }
    });
  });

  describe("roundtrip", () => {
    it("should roundtrip: create -> verify returns matching email and action", async () => {
      setSecret(TEST_SECRET);
      const email = "roundtrip@example.com";
      const action = "unsubscribe" as const;
      const expiresAt = Date.now() + 3600_000;

      const token = await Effect.runPromise(
        createToken({ email, action, expiresAt }),
      );
      const result = await Effect.runPromise(verifyToken(token));

      expect(result.email).toBe(email);
      expect(result.action).toBe(action);
      expect(result.expiresAt).toBe(expiresAt);
    });
  });
});
