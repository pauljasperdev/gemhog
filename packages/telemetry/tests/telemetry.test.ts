/**
 * Telemetry test suite — verifies makeTracingLive behaviour via constructor spies.
 * vi.mock replaces sdk-trace-base and sdk-trace-node so we can assert which classes
 * get instantiated without needing a real OTLP endpoint.
 */

import * as Effect from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTracingLive } from "../src/index";

// ------------------------------------------------------------------
// Module mocks — top-level, hoisted by vi (bun-compatible, no importOriginal)
// Named function expressions are used because:
//   1. vitest SSR mode requires non-arrow functions for constructor mocks (new ClassName())
//   2. biome's useArrowFunction rule does not apply to named function expressions
// ------------------------------------------------------------------

vi.mock("@opentelemetry/sdk-trace-base", () => ({
  ConsoleSpanExporter: vi.fn(function mockConsoleSpanExporter() {
    return {
      export: vi.fn((_spans: unknown, done: (result: unknown) => void) =>
        done({ code: 0 }),
      ),
      shutdown: vi.fn(() => Promise.resolve()),
    };
  }),
  BatchSpanProcessor: vi.fn(function mockBatchSpanProcessor() {
    return {
      onStart: vi.fn(),
      onEnd: vi.fn(),
      shutdown: vi.fn(() => Promise.resolve()),
      forceFlush: vi.fn(() => Promise.resolve()),
    };
  }),
}));

vi.mock("@opentelemetry/sdk-trace-node", () => ({
  TraceIdRatioBasedSampler: vi.fn(function mockTraceIdRatioBasedSampler() {
    return {
      shouldSample: vi.fn(() => ({ decision: 1 })),
      toString: vi.fn(() => "TraceIdRatioBasedSampler"),
    };
  }),
}));

// ------------------------------------------------------------------
// Test setup
// ------------------------------------------------------------------

let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  vi.clearAllMocks();
  delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  delete process.env.SENTRY_DSN;
  delete process.env.OTEL_TRACES_SAMPLER_ARG;
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// ------------------------------------------------------------------
// Backward compatibility
// ------------------------------------------------------------------

describe("backward compatibility", () => {
  it("accepts a plain string service name", async () => {
    const layer = makeTracingLive("test-service");
    await expect(
      Effect.Effect.runPromise(
        Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
      ),
    ).resolves.toBeUndefined();
  });
});

// ------------------------------------------------------------------
// Console fallback
// ------------------------------------------------------------------

describe("console fallback", () => {
  it("uses ConsoleSpanExporter when OTLP endpoint is not set", async () => {
    const { ConsoleSpanExporter } = await import(
      "@opentelemetry/sdk-trace-base"
    );

    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(ConsoleSpanExporter).toHaveBeenCalled();
  });

  it("logs a message when falling back to console exporter", async () => {
    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("console"));
  });
});

// ------------------------------------------------------------------
// Sampling configuration
// ------------------------------------------------------------------

describe("sampling configuration", () => {
  it("creates TraceIdRatioBasedSampler(0.1) by default", async () => {
    const { TraceIdRatioBasedSampler } = await import(
      "@opentelemetry/sdk-trace-node"
    );

    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(TraceIdRatioBasedSampler).toHaveBeenCalledWith(0.1);
  });

  it("uses OTEL_TRACES_SAMPLER_ARG when set to 0.5", async () => {
    process.env.OTEL_TRACES_SAMPLER_ARG = "0.5";
    const { TraceIdRatioBasedSampler } = await import(
      "@opentelemetry/sdk-trace-node"
    );

    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(TraceIdRatioBasedSampler).toHaveBeenCalledWith(0.5);
  });

  it("falls back to 0.1 when OTEL_TRACES_SAMPLER_ARG is non-numeric", async () => {
    process.env.OTEL_TRACES_SAMPLER_ARG = "not-a-number";
    const { TraceIdRatioBasedSampler } = await import(
      "@opentelemetry/sdk-trace-node"
    );

    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(TraceIdRatioBasedSampler).toHaveBeenCalledWith(0.1);
  });

  it("clamps to 1 when OTEL_TRACES_SAMPLER_ARG > 1", async () => {
    process.env.OTEL_TRACES_SAMPLER_ARG = "1.5";
    const { TraceIdRatioBasedSampler } = await import(
      "@opentelemetry/sdk-trace-node"
    );

    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(TraceIdRatioBasedSampler).toHaveBeenCalledWith(1);
  });

  it("clamps to 0 when OTEL_TRACES_SAMPLER_ARG < 0", async () => {
    process.env.OTEL_TRACES_SAMPLER_ARG = "-0.5";
    const { TraceIdRatioBasedSampler } = await import(
      "@opentelemetry/sdk-trace-node"
    );

    const layer = makeTracingLive("test-service");
    await Effect.Effect.runPromise(
      Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
    );

    expect(TraceIdRatioBasedSampler).toHaveBeenCalledWith(0);
  });
});

// ------------------------------------------------------------------
// Object config signature
// ------------------------------------------------------------------

describe("object config signature", () => {
  it("accepts { serviceName } object without throwing", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing call before full TS overload
    const layer = makeTracingLive({ serviceName: "my-service" } as any);
    await expect(
      Effect.Effect.runPromise(
        Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
      ),
    ).resolves.toBeUndefined();
  });
});
