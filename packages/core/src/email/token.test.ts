import { describe, expect, it } from "vitest";
import { createToken, verifyToken } from "./token";

const TEST_SECRET = "test-secret-at-least-32-characters-long";

describe("token", () => {
  describe("createToken", () => {
    it("should return a base64url-encoded string", () => {
      const token = createToken(
        {
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        },
        TEST_SECRET,
      );

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      // base64url chars only (no +, /, or =)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should create tokens with action "verify"', () => {
      const token = createToken(
        {
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        },
        TEST_SECRET,
      );

      expect(token).toBeTruthy();
    });

    it('should create tokens with action "unsubscribe"', () => {
      const token = createToken(
        {
          email: "user@example.com",
          action: "unsubscribe",
          expiresAt: Date.now() + 60_000,
        },
        TEST_SECRET,
      );

      expect(token).toBeTruthy();
    });
  });

  describe("verifyToken", () => {
    it("should return the original payload for a valid token", () => {
      const expiresAt = Date.now() + 60_000;
      const token = createToken(
        { email: "user@example.com", action: "verify", expiresAt },
        TEST_SECRET,
      );

      const result = verifyToken(token, TEST_SECRET);

      expect(result).toEqual({
        email: "user@example.com",
        action: "verify",
        expiresAt,
      });
    });

    it("should return null for an expired token", () => {
      const token = createToken(
        {
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() - 1000,
        },
        TEST_SECRET,
      );

      const result = verifyToken(token, TEST_SECRET);

      expect(result).toBeNull();
    });

    it("should return null for a tampered token", () => {
      const token = createToken(
        {
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        },
        TEST_SECRET,
      );

      // Tamper with the token by flipping a character
      const tampered = `X${token.slice(1)}`;

      const result = verifyToken(tampered, TEST_SECRET);

      expect(result).toBeNull();
    });

    it("should return null for malformed/garbage input", () => {
      expect(verifyToken("not-a-real-token", TEST_SECRET)).toBeNull();
      expect(verifyToken("", TEST_SECRET)).toBeNull();
      expect(verifyToken("abcdef", TEST_SECRET)).toBeNull();
    });

    it("should produce different tokens for same payload with different secrets", () => {
      const payload = {
        email: "user@example.com",
        action: "verify" as const,
        expiresAt: Date.now() + 60_000,
      };

      const token1 = createToken(payload, TEST_SECRET);
      const token2 = createToken(
        payload,
        "different-secret-at-least-32-characters-long",
      );

      expect(token1).not.toBe(token2);
    });

    it("should reject a token signed with a different secret", () => {
      const token = createToken(
        {
          email: "user@example.com",
          action: "verify",
          expiresAt: Date.now() + 60_000,
        },
        TEST_SECRET,
      );

      const result = verifyToken(
        token,
        "wrong-secret-at-least-32-characters-long",
      );

      expect(result).toBeNull();
    });
  });

  describe("roundtrip", () => {
    it("should roundtrip: create -> verify returns matching email and action", () => {
      const email = "roundtrip@example.com";
      const action = "unsubscribe" as const;
      const expiresAt = Date.now() + 3600_000;

      const token = createToken({ email, action, expiresAt }, TEST_SECRET);
      const result = verifyToken(token, TEST_SECRET);

      expect(result).not.toBeNull();
      expect(result?.email).toBe(email);
      expect(result?.action).toBe(action);
      expect(result?.expiresAt).toBe(expiresAt);
    });
  });
});
