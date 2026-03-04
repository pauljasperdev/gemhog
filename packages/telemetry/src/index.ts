import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import * as OtelApi from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-node";
import * as Sentry from "@sentry/node";
import { SentrySpanProcessor } from "@sentry/opentelemetry";
import * as Effect from "effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

type TracingConfig = string | { serviceName: string; serviceVersion?: string };

const resolveConfig = (
  config: TracingConfig,
): { serviceName: string; serviceVersion?: string } =>
  typeof config === "string"
    ? { serviceName: config, serviceVersion: undefined }
    : config;

export const makeTracingLive = (config: TracingConfig) =>
  Effect.Layer.unwrapEffect(
    Effect.Effect.gen(function* () {
      const cfg = resolveConfig(config);

      // Sampling rate with NaN/parse-error fallback to 0.1
      const rawRate = yield* pipe(
        Effect.Config.number("OTEL_TRACES_SAMPLER_ARG"),
        Effect.Config.withDefault(0.1),
        Effect.Effect.catchAll(() => {
          return Effect.Effect.gen(function* () {
            yield* Effect.Effect.logWarning(
              "OTEL_TRACES_SAMPLER_ARG is not a valid number, defaulting to 0.1",
            );
            return 0.1;
          });
        }),
      );

      const samplingRate = Number.isNaN(rawRate)
        ? 0.1
        : Math.max(0, Math.min(1, rawRate));

      const sampler = new TraceIdRatioBasedSampler(samplingRate);

      // Sentry DSN config
      const sentryDsn = yield* pipe(
        Effect.Config.string("SENTRY_DSN"),
        Effect.Config.option,
      );

      yield* Effect.Effect.log(
        `Telemetry: serviceName=${cfg.serviceName} sampling=${samplingRate}`,
      );

      // Choose span processor based on Sentry DSN availability
      let spanProcessor: BatchSpanProcessor | SentrySpanProcessor;
      if (Option.isSome(sentryDsn)) {
        OtelApi.propagation.setGlobalPropagator(
          new W3CTraceContextPropagator(),
        );
        // Initialize Sentry with DSN
        Sentry.init({
          dsn: sentryDsn.value,
          skipOpenTelemetrySetup: true,
        });
        spanProcessor = new SentrySpanProcessor();
      } else {
        yield* Effect.Effect.log(
          "SENTRY_DSN not configured, using console exporter",
        );
        spanProcessor = new BatchSpanProcessor(new ConsoleSpanExporter());
      }

      return NodeSdk.layer(() => ({
        resource: {
          serviceName: cfg.serviceName,
          ...(cfg.serviceVersion !== undefined
            ? { serviceVersion: cfg.serviceVersion }
            : {}),
          attributes: {
            "deployment.environment": process.env.NODE_ENV ?? "development",
          },
        },
        spanProcessor: spanProcessor,
        tracerConfig: { sampler },
        shutdownTimeout: "10 seconds",
      }));
    }),
  );
