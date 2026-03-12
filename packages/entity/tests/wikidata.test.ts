import { HttpClient, HttpClientResponse } from "@effect/platform";
import * as Effect from "effect";
import { Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { WikidataError } from "../src/errors.js";
import { WikidataClient } from "../src/wikidata.js";
import { WikidataClientLive } from "../src/wikidata.live.js";
import { MockWikidataClient } from "../src/wikidata.mock.js";

describe("Wikidata client", () => {
  describe("searchPerson", () => {
    it("returns Warren Buffett for warren buffett query", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchPerson("warren buffett");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.qid).toBe("Q47213");
      expect(result[0]?.label).toBe("Warren Buffett");
      expect(result[0]?.description).toBe(
        "American business magnate and investor",
      );
    });

    it("returns empty array for unknown person", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchPerson("unknown person");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(0);
    });

    it("handles buffett alias search", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchPerson("buffett");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.qid).toBe("Q47213");
    });
  });

  describe("searchInstitution", () => {
    it("returns Federal Reserve for federal reserve query", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchInstitution("federal reserve");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.qid).toBe("Q47488");
      expect(result[0]?.label).toBe("Federal Reserve System");
      expect(result[0]?.description).toBe(
        "central banking system of the United States",
      );
    });

    it("returns Federal Reserve for fed alias", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchInstitution("fed");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.qid).toBe("Q47488");
    });

    it("returns empty array for unknown institution", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchInstitution("unknown institution");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("searchPlace", () => {
    it("returns empty array for unknown place", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.searchPlace("unknown place");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("getEntity", () => {
    it("returns Warren Buffett entity with aliases for Q47213", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.getEntity("Q47213");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result.qid).toBe("Q47213");
      expect(result.label).toBe("Warren Buffett");
      expect(result.aliases).toContain("Buffett");
      expect(result.aliases).toContain("Oracle of Omaha");
      expect(result.claims).toHaveProperty("P31", "human");
    });

    it("returns Federal Reserve entity for Q47488", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.getEntity("Q47488");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(result.qid).toBe("Q47488");
      expect(result.label).toBe("Federal Reserve System");
      expect(result.aliases).toContain("Fed");
      expect(result.aliases).toContain("The Fed");
    });

    it("fails with WikidataError for unknown QID", async () => {
      const exit = await Effect.Effect.runPromiseExit(
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          return yield* client.getEntity("UNKNOWN");
        }).pipe(Effect.Effect.provide(MockWikidataClient)),
      );
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(WikidataError);
          expect((error.error as WikidataError).cause).toContain(
            "Entity not found",
          );
        }
      }
    });
  });
});

describe("WikidataClientLive retry behavior", () => {
  it("retries on 429 response and succeeds on subsequent 200", async () => {
    // Track how many HTTP requests are made
    const state = { calls: 0 };

    // Mock HTTP response for Wikidata search
    const successResponse = JSON.stringify({
      search: [
        { id: "Q12345", label: "Test Entity", description: "Test description" },
      ],
    });

    // Create a mock HttpClient that returns 429 first, then 200
    const MockHttpClientLayer = Layer.succeed(
      HttpClient.HttpClient,
      HttpClient.make((request) => {
        state.calls++;

        if (state.calls === 1) {
          // First request: return 429 (rate limited)
          return Effect.Effect.succeed(
            HttpClientResponse.fromWeb(
              request,
              new Response("", { status: 429 }),
            ),
          );
        }
        // Subsequent requests: return 200 with success
        return Effect.Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            new Response(successResponse, {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          ),
        );
      }),
    );

    const result = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const client = yield* WikidataClient;
        return yield* client.searchPerson("test query");
      }).pipe(
        Effect.Effect.provide(WikidataClientLive),
        Effect.Effect.provide(MockHttpClientLayer),
      ),
    );

    // Assert the request was retried (at least 2 calls made)
    expect(state.calls).toBeGreaterThanOrEqual(2);

    // Assert the result is correct
    expect(result).toHaveLength(1);
    expect(result[0]?.qid).toBe("Q12345");
    expect(result[0]?.label).toBe("Test Entity");
  });
});
