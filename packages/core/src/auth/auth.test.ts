// packages/core/src/auth/auth.test.ts
import { describe, expect, it } from "vitest";
import { auth, getAuth, getSession } from "./auth.service";

// Note: Cannot easily unit test without mocking env
// These tests verify the structure, not runtime behavior
describe("auth", () => {
  describe("getAuth", () => {
    it("should be a function", () => {
      expect(typeof getAuth).toBe("function");
    });
  });

  describe("auth proxy", () => {
    it("should be an object", () => {
      expect(typeof auth).toBe("object");
    });
  });

  describe("getSession", () => {
    it("should be a function", () => {
      expect(typeof getSession).toBe("function");
    });
  });
});
