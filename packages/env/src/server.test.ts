// packages/env/src/server.test.ts
// Unit tests for ServerConfig schema validation using Effect ConfigProvider
// for isolated testing without touching process.env
import { Config, ConfigProvider, Effect, Redacted } from "effect";
import { describe, expect, it } from "vitest";

// Recreate the config definition for isolated testing
// DO NOT import from ./server.ts - that would trigger validation with real env vars
const ServerConfig = Config.all({
  DATABASE_URL: Config.redacted("DATABASE_URL"),
  BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL"),
  CORS_ORIGIN: Config.string("CORS_ORIGIN"),
  NODE_ENV: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
});

// Helper to create a ConfigProvider from a map of env vars
const createProvider = (vars: Record<string, string>) =>
  ConfigProvider.fromMap(new Map(Object.entries(vars)));

// All required vars for a valid config
const validEnvVars = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  BETTER_AUTH_SECRET: "super-secret-key-for-auth",
  BETTER_AUTH_URL: "http://localhost:3000",
  CORS_ORIGIN: "http://localhost:3001",
};

describe("ServerConfig schema", () => {
  describe("missing required vars", () => {
    it("should fail when DATABASE_URL is missing", async () => {
      const { DATABASE_URL: _, ...rest } = validEnvVars;
      const provider = createProvider(rest);

      await expect(
        Effect.runPromise(
          ServerConfig.pipe(Effect.withConfigProvider(provider)),
        ),
      ).rejects.toThrow();
    });

    it("should fail when BETTER_AUTH_SECRET is missing", async () => {
      const { BETTER_AUTH_SECRET: _, ...rest } = validEnvVars;
      const provider = createProvider(rest);

      await expect(
        Effect.runPromise(
          ServerConfig.pipe(Effect.withConfigProvider(provider)),
        ),
      ).rejects.toThrow();
    });

    it("should fail when BETTER_AUTH_URL is missing", async () => {
      const { BETTER_AUTH_URL: _, ...rest } = validEnvVars;
      const provider = createProvider(rest);

      await expect(
        Effect.runPromise(
          ServerConfig.pipe(Effect.withConfigProvider(provider)),
        ),
      ).rejects.toThrow();
    });

    it("should fail when CORS_ORIGIN is missing", async () => {
      const { CORS_ORIGIN: _, ...rest } = validEnvVars;
      const provider = createProvider(rest);

      await expect(
        Effect.runPromise(
          ServerConfig.pipe(Effect.withConfigProvider(provider)),
        ),
      ).rejects.toThrow();
    });
  });

  describe("valid config", () => {
    it("should succeed with all required vars", async () => {
      const provider = createProvider(validEnvVars);

      const result = await Effect.runPromise(
        ServerConfig.pipe(Effect.withConfigProvider(provider)),
      );

      expect(result.BETTER_AUTH_URL).toBe("http://localhost:3000");
      expect(result.CORS_ORIGIN).toBe("http://localhost:3001");
    });

    it("should default NODE_ENV to 'development' when not provided", async () => {
      const provider = createProvider(validEnvVars);

      const result = await Effect.runPromise(
        ServerConfig.pipe(Effect.withConfigProvider(provider)),
      );

      expect(result.NODE_ENV).toBe("development");
    });

    it("should use provided NODE_ENV when specified", async () => {
      const provider = createProvider({
        ...validEnvVars,
        NODE_ENV: "production",
      });

      const result = await Effect.runPromise(
        ServerConfig.pipe(Effect.withConfigProvider(provider)),
      );

      expect(result.NODE_ENV).toBe("production");
    });
  });

  describe("redacted values", () => {
    it("should wrap DATABASE_URL in Redacted", async () => {
      const provider = createProvider(validEnvVars);

      const result = await Effect.runPromise(
        ServerConfig.pipe(Effect.withConfigProvider(provider)),
      );

      // Redacted values should be wrapped
      expect(Redacted.isRedacted(result.DATABASE_URL)).toBe(true);
      // Value can be extracted with Redacted.value
      expect(Redacted.value(result.DATABASE_URL)).toBe(
        validEnvVars.DATABASE_URL,
      );
    });

    it("should wrap BETTER_AUTH_SECRET in Redacted", async () => {
      const provider = createProvider(validEnvVars);

      const result = await Effect.runPromise(
        ServerConfig.pipe(Effect.withConfigProvider(provider)),
      );

      expect(Redacted.isRedacted(result.BETTER_AUTH_SECRET)).toBe(true);
      expect(Redacted.value(result.BETTER_AUTH_SECRET)).toBe(
        validEnvVars.BETTER_AUTH_SECRET,
      );
    });
  });
});
