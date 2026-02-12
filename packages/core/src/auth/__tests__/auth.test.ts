import { beforeAll, describe, expect, it } from "vitest";

const TEST_ENV = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DATABASE_URL_POOLER: "postgresql://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "test-google-api-key",
  SENTRY_DSN: "https://key@sentry.io/123",
};

let auth: typeof import("../service").auth;
let getSession: typeof import("../service").getSession;

beforeAll(async () => {
  Object.assign(process.env, TEST_ENV);
  const authModule = await import("../service");
  auth = authModule.auth;
  getSession = authModule.getSession;
});

describe("auth", () => {
  describe("auth", () => {
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
