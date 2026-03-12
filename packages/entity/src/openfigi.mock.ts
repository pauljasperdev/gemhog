import * as Effect from "effect";
import { OpenFigiNotFoundError } from "./errors";
import { OpenFigiClient, type OpenFigiResult } from "./openfigi";

const FIXTURES: Record<string, OpenFigiResult> = {
  NVDA: {
    figi: "BBG000BBJQV0",
    name: "NVIDIA CORP",
    ticker: "NVDA",
    exchCode: "UW",
    securityType: "Common Stock",
  },
  AAPL: {
    figi: "BBG000B9XRY4",
    name: "APPLE INC",
    ticker: "AAPL",
    exchCode: "UW",
    securityType: "Common Stock",
  },
  MSFT: {
    figi: "BBG000BPH459",
    name: "MICROSOFT CORP",
    ticker: "MSFT",
    exchCode: "UW",
    securityType: "Common Stock",
  },
};

export const MockOpenFigiClient = Effect.Layer.succeed(
  OpenFigiClient,
  OpenFigiClient.of({
    // Simulates /v3/mapping with idType: TICKER
    lookupByTicker: (ticker) => {
      const result = FIXTURES[ticker.toUpperCase()];
      if (result) {
        return Effect.Effect.succeed(result);
      }
      return Effect.Effect.fail(new OpenFigiNotFoundError({ ticker }));
    },

    // Simulates /v3/search with query parameter (keyword search on company name)
    lookupByName: (name) => {
      const results = Object.values(FIXTURES).filter((f) =>
        f.name.toLowerCase().includes(name.toLowerCase()),
      );
      return Effect.Effect.succeed(results);
    },
  }),
);
