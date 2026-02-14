import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import * as Resource from "@effect/opentelemetry/Resource";
import * as Tracer from "@effect/opentelemetry/Tracer";
import * as OtelApi from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import * as Effect from "effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

export const makeTracingLive = (serviceName: string) =>
  Effect.Layer.unwrapEffect(
    Effect.Effect.gen(function* () {
      const otlpEndpoint = yield* pipe(
        Effect.Config.string("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"),
        Effect.Config.option,
      );
      const sentryDsn = yield* pipe(
        Effect.Config.string("SENTRY_DSN"),
        Effect.Config.option,
      );

      const resourceLayer = Resource.layer({
        serviceName,
      });

      if (Option.isNone(otlpEndpoint) || Option.isNone(sentryDsn)) {
        return Tracer.layerGlobal.pipe(Effect.Layer.provide(resourceLayer));
      }

      OtelApi.propagation.setGlobalPropagator(new W3CTraceContextPropagator());

      const spanProcessor = new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: otlpEndpoint.value,
          headers: {
            "x-sentry-dsn": sentryDsn.value,
          },
        }),
      );

      const tracerProviderLayer = NodeSdk.layerTracerProvider(spanProcessor);
      const tracerLayer = Tracer.layer.pipe(
        Effect.Layer.provide(tracerProviderLayer),
        Effect.Layer.provide(resourceLayer),
      );

      return tracerLayer;
    }),
  );
