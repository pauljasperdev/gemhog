import * as Effect from "effect";
import { describe, expect, it } from "vitest";
import { OpenFigiNotFoundError } from "../src/errors.js";
import { OpenFigiClient } from "../src/openfigi.js";
import { MockOpenFigiClient } from "../src/openfigi.mock.js";

describe("OpenFigi client", () => {
  // Tests for /v3/mapping endpoint with idType: TICKER
  describe("lookupByTicker", () => {
    it("returns NVDA fixture for known ticker", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByTicker("NVDA");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result.figi).toBe("BBG000BBJQV0");
      expect(result.name).toBe("NVIDIA CORP");
      expect(result.ticker).toBe("NVDA");
      expect(result.exchCode).toBe("UW");
    });

    it("returns AAPL fixture for known ticker", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByTicker("AAPL");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result.figi).toBe("BBG000B9XRY4");
      expect(result.name).toBe("APPLE INC");
      expect(result.ticker).toBe("AAPL");
      expect(result.exchCode).toBe("UW");
    });

    it("fails with OpenFigiNotFoundError for unknown ticker", async () => {
      const error = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByTicker("UNKNOWN");
        }).pipe(Effect.Effect.flip, Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(error).toBeInstanceOf(OpenFigiNotFoundError);
      expect((error as OpenFigiNotFoundError).ticker).toBe("UNKNOWN");
    });

    it("handles case-insensitive ticker lookup", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByTicker("nvda");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result.ticker).toBe("NVDA");
    });
  });

  // Tests for /v3/search endpoint (keyword search on company name)
  // Note: lookupByName uses the /v3/search API, NOT /v3/mapping with idType
  describe("lookupByName", () => {
    it("returns array with NVDA result for NVIDIA keyword search", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByName("NVIDIA");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.ticker).toBe("NVDA");
      expect(result[0]?.name).toBe("NVIDIA CORP");
    });

    it("returns empty array for unknown company", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByName("unknown company");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result).toHaveLength(0);
    });

    it("handles case-insensitive name search", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByName("nvidia");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("NVIDIA CORP");
    });

    it("returns multiple results for partial match", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByName("CORP");
        }).pipe(Effect.Effect.provide(MockOpenFigiClient)),
      );
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
