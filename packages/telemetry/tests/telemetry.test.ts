import * as Effect from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTracingLive } from "../src/index";

describe("makeTracingLive", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Clear environment variables before each test
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    delete process.env.SENTRY_DSN;
    delete process.env.OTEL_TRACES_SAMPLER_ARG;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("sampling configuration", () => {
    it("uses 10% sampling by default when OTEL_TRACES_SAMPLER_ARG not set", async () => {
      // When OTEL_TRACES_SAMPLER_ARG is not set, sampling should default to 0.1 (10%)
      const layer = makeTracingLive("test-service");

      // The layer should be creatable and provide without throwing
      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify sampling rate is 0.1 by inspecting NodeSdk configuration
      // This will require exposing the sampler configuration in the implementation
    });

    it("uses custom sampling rate from OTEL_TRACES_SAMPLER_ARG", async () => {
      process.env.OTEL_TRACES_SAMPLER_ARG = "0.5";
      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify sampling rate is 0.5
    });

    it("falls back to 0.1 when OTEL_TRACES_SAMPLER_ARG is invalid (non-numeric)", async () => {
      process.env.OTEL_TRACES_SAMPLER_ARG = "not-a-number";
      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify sampling rate falls back to 0.1
    });

    it("clamps sampling rate to 1.0 when OTEL_TRACES_SAMPLER_ARG > 1", async () => {
      process.env.OTEL_TRACES_SAMPLER_ARG = "1.5";
      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify sampling rate is clamped to 1.0
    });

    it("clamps sampling rate to 0.0 when OTEL_TRACES_SAMPLER_ARG < 0", async () => {
      process.env.OTEL_TRACES_SAMPLER_ARG = "-0.5";
      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify sampling rate is clamped to 0.0
    });
  });

  describe("console fallback", () => {
    it("falls back to console exporter when OTEL_EXPORTER_OTLP_TRACES_ENDPOINT not set", async () => {
      // When OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is not set, should use console exporter
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
      delete process.env.SENTRY_DSN;

      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify ConsoleSpanExporter is used instead of OTLPTraceExporter
    });

    it("logs a message when falling back to console exporter", async () => {
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
      delete process.env.SENTRY_DSN;

      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify console.log was called with a message about console fallback
      // expect(consoleSpy).toHaveBeenCalledWith(
      //   expect.stringContaining("console")
      // );
    });
  });

  describe("configuration signatures", () => {
    it("accepts string config for backward compatibility", async () => {
      // Should accept a simple string service name
      const layer = makeTracingLive("my-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();
    });

    it.skip("accepts object config with serviceName", async () => {
      // TODO: Task 5 - Update makeTracingLive to accept object config
      // Should accept an object with serviceName property
      // const layer = makeTracingLive({ serviceName: "my-service" });
      //
      // await expect(
      //   Effect.Effect.runPromise(
      //     Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
      //   ),
      // ).resolves.toBeUndefined();
    });
  });

  describe("resource attributes", () => {
    it.skip("includes serviceVersion in resource attributes when provided", async () => {
      // TODO: Task 5 - Add serviceVersion support to makeTracingLive
      // When serviceVersion is provided in config, it should be included in resource
      // const layer = makeTracingLive({
      //   serviceName: "my-service",
      //   serviceVersion: "1.2.3",
      // });
      //
      // await expect(
      //   Effect.Effect.runPromise(
      //     Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
      //   ),
      // ).resolves.toBeUndefined();
      //
      // TODO: Verify serviceVersion is in resource attributes
    });

    it.skip("omits serviceVersion from resource attributes when not provided", async () => {
      // TODO: Task 5 - Add serviceVersion support to makeTracingLive
      // When serviceVersion is not provided, it should not be in resource
      // const layer = makeTracingLive({
      //   serviceName: "my-service",
      // });
      //
      // await expect(
      //   Effect.Effect.runPromise(
      //     Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
      //   ),
      // ).resolves.toBeUndefined();
      //
      // TODO: Verify serviceVersion is not in resource attributes
    });
  });

  describe("shutdown configuration", () => {
    it("configures shutdown timeout of 10 seconds", async () => {
      const layer = makeTracingLive("test-service");

      await expect(
        Effect.Effect.runPromise(
          Effect.Effect.void.pipe(Effect.Effect.provide(layer)),
        ),
      ).resolves.toBeUndefined();

      // TODO: Verify shutdown timeout is configured to 10 seconds
      // This may require inspecting NodeSdk configuration or testing graceful shutdown
    });
  });
});
