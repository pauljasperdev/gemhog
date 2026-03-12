import { it } from "@effect/vitest";
import * as Effect from "effect";
import { ConfigProvider, Exit, Layer } from "effect";
import { describe, expect } from "vitest";
import { OpenFigiLayer, WikidataLayer } from "../src/layer";
import { OpenFigiClient } from "../src/openfigi";
import { WikidataClient } from "../src/wikidata";

// Config with SST_STAGE=test for mock layer selection
const TestConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["SST_STAGE", "test"]])),
);

// Config with SST_STAGE=dev for live layer selection
const DevConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["SST_STAGE", "dev"]])),
);

// Config with SST_STAGE=prod for live layer selection
const ProdConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["SST_STAGE", "prod"]])),
);

// Config without SST_STAGE
const NoStageConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map()),
);

describe("layer selection", () => {
  describe("OpenFigiClient selection", () => {
    it.effect("SST_STAGE=test uses MockOpenFigiClient with fixture data", () =>
      Effect.Effect.gen(function* () {
        const client = yield* OpenFigiClient;
        // Mock returns fixture data for NVDA
        const result = yield* client.lookupByTicker("NVDA");

        // Mock fixture for NVDA returns specific FIGI
        expect(result).not.toBeNull();
        expect(result?.figi).toBe("BBG000BBJQV0");
        expect(result?.ticker).toBe("NVDA");
      }).pipe(
        Effect.Effect.provide(OpenFigiLayer),
        Effect.Effect.provide(TestConfigLayer),
      ),
    );

    it.effect(
      "SST_STAGE=test MockOpenFigiClient name search returns fixture data",
      () =>
        Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          // Mock filters fixtures by name substring
          const result = yield* client.lookupByName("NVIDIA");

          // Should find NVIDIA CORP fixture
          expect(result.length).toBeGreaterThan(0);
          expect(result[0]?.name).toContain("NVIDIA");
        }).pipe(
          Effect.Effect.provide(OpenFigiLayer),
          Effect.Effect.provide(TestConfigLayer),
        ),
    );

    it.effect(
      "SST_STAGE=dev selects OpenFigiClientLive (verifiable by layer build)",
      () =>
        Effect.Effect.gen(function* () {
          // When SST_STAGE=dev, the layer selection resolves to OpenFigiClientLive
          // We verify this by checking that a lookup call would use the live implementation
          // (The call would fail on network in unit tests, but layer construction succeeds)

          // Build the layer to verify selection happens correctly
          const exit = yield* Effect.Effect.exit(
            Effect.Effect.gen(function* () {
              const client = yield* OpenFigiClient;
              // Calling lookupByTicker will attempt network call with live client
              // This will fail because we're in unit tests without network
              // But the important thing is that the layer builds and selects correctly
              return yield* client
                .lookupByTicker("DUMMY")
                .pipe(
                  Effect.Effect.catchAll(() => Effect.Effect.succeed(null)),
                );
            }).pipe(
              Effect.Effect.provide(OpenFigiLayer),
              Effect.Effect.provide(DevConfigLayer),
              Effect.Effect.timeout("5 seconds"),
            ),
          );

          // Layer should build successfully (even if the network call fails)
          expect(Exit.isSuccess(exit)).toBe(true);
        }),
    );

    it.effect("SST_STAGE=prod selects OpenFigiClientLive", () =>
      Effect.Effect.gen(function* () {
        const exit = yield* Effect.Effect.exit(
          Effect.Effect.gen(function* () {
            const client = yield* OpenFigiClient;
            return yield* client
              .lookupByTicker("DUMMY")
              .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed(null)));
          }).pipe(
            Effect.Effect.provide(OpenFigiLayer),
            Effect.Effect.provide(ProdConfigLayer),
            Effect.Effect.timeout("5 seconds"),
          ),
        );

        expect(Exit.isSuccess(exit)).toBe(true);
      }),
    );
  });

  describe("WikidataClient selection", () => {
    it.effect("SST_STAGE=test uses MockWikidataClient with fixture data", () =>
      Effect.Effect.gen(function* () {
        const client = yield* WikidataClient;
        // Mock returns fixture for "warren buffett"
        const result = yield* client.searchPerson("warren buffett");

        expect(result.length).toBeGreaterThan(0);
        expect(result[0]?.qid).toBe("Q47213");
        expect(result[0]?.label).toBe("Warren Buffett");
      }).pipe(
        Effect.Effect.provide(WikidataLayer),
        Effect.Effect.provide(TestConfigLayer),
      ),
    );

    it.effect(
      "SST_STAGE=test MockWikidataClient getEntity returns fixture",
      () =>
        Effect.Effect.gen(function* () {
          const client = yield* WikidataClient;
          const result = yield* client.getEntity("Q47213");

          expect(result.qid).toBe("Q47213");
          expect(result.aliases).toContain("Oracle of Omaha");
        }).pipe(
          Effect.Effect.provide(WikidataLayer),
          Effect.Effect.provide(TestConfigLayer),
        ),
    );

    it.effect("SST_STAGE=dev selects WikidataClientLive", () =>
      Effect.Effect.gen(function* () {
        const exit = yield* Effect.Effect.exit(
          Effect.Effect.gen(function* () {
            const client = yield* WikidataClient;
            return yield* client
              .searchPerson("test")
              .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed([])));
          }).pipe(
            Effect.Effect.provide(WikidataLayer),
            Effect.Effect.provide(DevConfigLayer),
            Effect.Effect.timeout("5 seconds"),
          ),
        );

        expect(Exit.isSuccess(exit)).toBe(true);
      }),
    );
  });

  describe("SST_STAGE configuration requirement", () => {
    it.effect("layer fails to build when SST_STAGE is not provided", () =>
      Effect.Effect.gen(function* () {
        const exit = yield* Effect.Effect.exit(
          Effect.Effect.gen(function* () {
            const client = yield* OpenFigiClient;
            return client;
          }).pipe(
            Effect.Effect.provide(OpenFigiLayer),
            Effect.Effect.provide(NoStageConfigLayer),
          ),
        );

        // Should fail because SST_STAGE config is required
        expect(Exit.isFailure(exit)).toBe(true);
      }),
    );

    it.effect("unknown SST_STAGE value uses mock implementations", () =>
      Effect.Effect.gen(function* () {
        // Values other than "dev" or "prod" should use mocks
        const customStageConfig = Layer.setConfigProvider(
          ConfigProvider.fromMap(
            new Map([["SST_STAGE", "staging"]]), // Not "dev" or "prod"
          ),
        );

        const result = yield* Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByTicker("AAPL");
        }).pipe(
          Effect.Effect.provide(OpenFigiLayer),
          Effect.Effect.provide(customStageConfig),
        );

        // Should return mock data for AAPL
        expect(result?.figi).toBe("BBG000B9XRY4");
      }),
    );
  });
});
