import * as OtelApi from "@opentelemetry/api";

const headersGetter: OtelApi.TextMapGetter<Headers> = {
  keys: (carrier: Headers) => Array.from(carrier.keys()),
  get: (carrier: Headers, key: string) => carrier.get(key) ?? undefined,
};

export function getSpanContext(headers: Headers): OtelApi.SpanContext | null {
  const context = OtelApi.propagation.extract(
    OtelApi.context.active(),
    headers,
    headersGetter,
  );
  return OtelApi.trace.getSpanContext(context) ?? null;
}
