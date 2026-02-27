import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HttpClient,
  type HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { it } from "@effect/vitest";
import * as Effect from "effect";
import { ConfigProvider, Exit, Fiber, Layer, TestClock } from "effect";
import { describe, expect } from "vitest";
import { PodscanService } from "../src/podscan";
import { PodscanServiceLive } from "../src/podscan.live";

const makeClientResponse = (
  request: HttpClientRequest.HttpClientRequest,
  status: number,
  body: unknown = {},
): HttpClientResponse.HttpClientResponse =>
  HttpClientResponse.fromWeb(
    request,
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

const validEpisodesBody = {
  episodes: [],
  pagination: {
    total: 0,
    per_page: 25,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  },
};

const testConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(
    new Map([
      ["PODSCAN_API_TOKEN", "test-token"],
      ["PODSCAN_BASE_URL", "https://test.podscan.api"],
    ]),
  ),
);

const makeMockClient = (
  statuses: number[],
  successBody: unknown = validEpisodesBody,
) => {
  const state = { calls: 0 };
  const layer = Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make((request, _url, _signal, _fiber) => {
      const idx = Math.min(state.calls, statuses.length - 1);
      const status = statuses[idx] ?? 500;
      state.calls++;
      return Effect.Effect.succeed(
        makeClientResponse(request, status, status < 400 ? successBody : {}),
      );
    }),
  );
  return { layer, state };
};

const makeServiceLayer = (mockLayer: Layer.Layer<HttpClient.HttpClient>) =>
  PodscanServiceLive.pipe(
    Layer.provide(Layer.merge(mockLayer, testConfigLayer)),
  );

const runGetLatest = (serviceLayer: Layer.Layer<PodscanService, unknown>) =>
  PodscanService.pipe(
    Effect.Effect.flatMap((svc) => svc.getLatest("pd_test_123")),
    Effect.Effect.provide(Layer.orDie(serviceLayer)),
    Effect.Effect.exit,
  );

describe("Podscan rate-limit retry behavior", () => {
  it("retryTransient is absent; fixed 61s and exponential schedules are present", () => {
    const filePath = resolve(__dirname, "../src/podscan.live.ts");
    const content = readFileSync(filePath, "utf-8");
    expect(content).not.toContain("retryTransient");
    expect(content).toContain('Schedule.fixed("61 seconds")');
    expect(content).toContain('Schedule.exponential("500 millis")');
  });

  it.effect(
    "429 always: fails after 1 original + 2 retries = 3 total calls",
    () =>
      Effect.Effect.gen(function* () {
        const { layer, state } = makeMockClient([429]);
        const serviceLayer = makeServiceLayer(layer);

        const fiber = yield* Effect.Effect.fork(runGetLatest(serviceLayer));
        yield* TestClock.adjust("61 seconds");
        yield* TestClock.adjust("61 seconds");

        const exit = yield* Fiber.join(fiber);

        expect(state.calls).toBe(3);
        expect(Exit.isFailure(exit)).toBe(true);
      }),
  );

  it.effect("429 then 200: succeeds after 1 retry with 61s delay", () =>
    Effect.Effect.gen(function* () {
      const { layer, state } = makeMockClient([429, 200]);
      const serviceLayer = makeServiceLayer(layer);

      const fiber = yield* Effect.Effect.fork(runGetLatest(serviceLayer));
      yield* TestClock.adjust("61 seconds");

      const exit = yield* Fiber.join(fiber);

      expect(state.calls).toBe(2);
      expect(Exit.isSuccess(exit)).toBe(true);
    }),
  );

  it.effect(
    "500 always: fails after 1 original + 3 retries = 4 total calls",
    () =>
      Effect.Effect.gen(function* () {
        const { layer, state } = makeMockClient([500]);
        const serviceLayer = makeServiceLayer(layer);

        const fiber = yield* Effect.Effect.fork(runGetLatest(serviceLayer));
        yield* TestClock.adjust("500 millis");
        yield* TestClock.adjust("1000 millis");
        yield* TestClock.adjust("2000 millis");

        const exit = yield* Fiber.join(fiber);

        expect(state.calls).toBe(4);
        expect(Exit.isFailure(exit)).toBe(true);
      }),
  );

  it.effect("500 then 200: succeeds after 1 transient retry", () =>
    Effect.Effect.gen(function* () {
      const { layer, state } = makeMockClient([500, 200]);
      const serviceLayer = makeServiceLayer(layer);

      const fiber = yield* Effect.Effect.fork(runGetLatest(serviceLayer));
      yield* TestClock.adjust("500 millis");

      const exit = yield* Fiber.join(fiber);

      expect(state.calls).toBe(2);
      expect(Exit.isSuccess(exit)).toBe(true);
    }),
  );
});

describe("Podscan getLatest URL parameters", () => {
  it.effect("since parameter is correctly appended to URL", () =>
    Effect.Effect.gen(function* () {
      let capturedUrl: string | undefined;
      const layer = Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make((request, _url, _signal, _fiber) => {
          capturedUrl = request.url;
          return Effect.Effect.succeed(
            makeClientResponse(request, 200, validEpisodesBody),
          );
        }),
      );
      const serviceLayer = makeServiceLayer(layer);

      const fiber = yield* Effect.Effect.fork(
        PodscanService.pipe(
          Effect.Effect.flatMap((svc) =>
            svc.getLatest("pd_test_123", undefined, "2024-02-26T00:00:00Z"),
          ),
          Effect.Effect.provide(Layer.orDie(serviceLayer)),
          Effect.Effect.exit,
        ),
      );
      yield* TestClock.adjust("0 millis");

      yield* Fiber.join(fiber);

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl).toContain("&since=2024-02-26T00:00:00Z");
    }),
  );

  it.effect("page parameter is correctly appended to URL", () =>
    Effect.Effect.gen(function* () {
      let capturedUrl: string | undefined;
      const layer = Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make((request, _url, _signal, _fiber) => {
          capturedUrl = request.url;
          return Effect.Effect.succeed(
            makeClientResponse(request, 200, validEpisodesBody),
          );
        }),
      );
      const serviceLayer = makeServiceLayer(layer);

      const fiber = yield* Effect.Effect.fork(
        PodscanService.pipe(
          Effect.Effect.flatMap((svc) =>
            svc.getLatest("pd_test_123", undefined, undefined, 3),
          ),
          Effect.Effect.provide(Layer.orDie(serviceLayer)),
          Effect.Effect.exit,
        ),
      );
      yield* TestClock.adjust("0 millis");

      yield* Fiber.join(fiber);

      expect(capturedUrl).toBeDefined();
      expect(capturedUrl).toContain("&page=3");
    }),
  );
});
