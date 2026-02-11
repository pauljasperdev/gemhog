import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import * as Resource from "@effect/opentelemetry/Resource";
import * as Tracer from "@effect/opentelemetry/Tracer";
import * as OtelApi from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Config, Effect, Layer } from "effect";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";

export const makeTracingLive = (serviceName: string) =>
  Layer.unwrapEffect(
    Effect.gen(function* () {
      const otlpEndpoint = yield* pipe(
        Config.string("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"),
        Config.option,
      );
      const sentryDsn = yield* pipe(Config.string("SENTRY_DSN"), Config.option);

      const resourceLayer = Resource.layer({
        serviceName,
      });

      if (Option.isNone(otlpEndpoint) || Option.isNone(sentryDsn)) {
        return Tracer.layerGlobal.pipe(Layer.provide(resourceLayer));
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
        Layer.provide(tracerProviderLayer),
        Layer.provide(resourceLayer),
      );

      return tracerLayer;
    }),
  );
