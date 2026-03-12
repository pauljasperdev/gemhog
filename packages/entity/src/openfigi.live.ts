import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect";
import { Schema } from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import * as Option from "effect/Option";
import * as Redacted from "effect/Redacted";
import { OpenFigiError, OpenFigiNotFoundError } from "./errors";
import { OpenFigiClient, type OpenFigiResult } from "./openfigi";

const OpenFigiResponseItem = Schema.Struct({
  figi: Schema.String,
  name: Schema.String,
  ticker: Schema.String,
  exchCode: Schema.Union(Schema.String, Schema.Null),
  securityType: Schema.String,
});

const OpenFigiMappingResult = Schema.Struct({
  data: Schema.optional(Schema.Array(OpenFigiResponseItem)),
  warning: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
});

const OpenFigiResponse = Schema.Array(OpenFigiMappingResult);

const OpenFigiSearchResponse = Schema.Struct({
  data: Schema.optional(Schema.Array(OpenFigiResponseItem)),
  error: Schema.optional(Schema.String),
  next: Schema.optional(Schema.String),
});

const TRANSIENT_STATUSES = [408, 500, 502, 503, 504];

const isTransient = (e: unknown): boolean => {
  if (e instanceof HttpClientError.ResponseError) {
    return TRANSIENT_STATUSES.includes(e.response.status);
  }
  if (e instanceof HttpClientError.RequestError) {
    return e.reason === "Transport";
  }
  return false;
};

const isRateLimited = (e: unknown): boolean =>
  e instanceof HttpClientError.ResponseError && e.response.status === 429;

type OpenFigiResponseItemType = typeof OpenFigiResponseItem.Type;

const toOpenFigiResult = (item: OpenFigiResponseItemType): OpenFigiResult => ({
  figi: item.figi,
  name: item.name,
  ticker: item.ticker,
  exchCode: item.exchCode,
  securityType: item.securityType,
});

const decodeMappingResult = (
  ticker: string,
  body: ReadonlyArray<typeof OpenFigiMappingResult.Type>,
) =>
  Effect.Effect.gen(function* () {
    const first = body[0];
    if (!first || first.warning || !first.data || first.data.length === 0) {
      return yield* Effect.Effect.fail(new OpenFigiNotFoundError({ ticker }));
    }
    if (first.error) {
      return yield* Effect.Effect.fail(
        new OpenFigiError({ cause: first.error }),
      );
    }
    const result = first.data[0];
    if (!result) {
      return yield* Effect.Effect.fail(new OpenFigiNotFoundError({ ticker }));
    }
    return toOpenFigiResult(result);
  });

export const OpenFigiClientLive = Effect.Layer.scoped(
  OpenFigiClient,
  Effect.Effect.gen(function* () {
    const apiKey = yield* Effect.Config.option(
      Effect.Config.redacted("OPENFIGI_API_KEY"),
    );

    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    const addApiKeyHeader = (req: HttpClientRequest.HttpClientRequest) =>
      Option.match(apiKey, {
        onNone: () => req,
        onSome: (key) =>
          HttpClientRequest.setHeader(
            "X-OPENFIGI-APIKEY",
            Redacted.value(key),
          )(req),
      });

    // API key (if set) increases rate limits from 25 to 250 requests/minute
    const makeMappingRequest = (body: readonly Record<string, string>[]) => {
      const request = HttpClientRequest.post(
        "https://api.openfigi.com/v3/mapping",
      ).pipe(HttpClientRequest.bodyUnsafeJson(body), addApiKeyHeader);
      return client.execute(request);
    };

    const makeSearchRequest = (query: string) => {
      const request = HttpClientRequest.post(
        "https://api.openfigi.com/v3/search",
      ).pipe(HttpClientRequest.bodyUnsafeJson({ query }), addApiKeyHeader);
      return client.execute(request);
    };

    const lookupByTicker = Effect.Effect.fn("entity.openfigi.lookupByTicker")(
      function* (ticker: string) {
        yield* annotateCurrentSpan("ticker", ticker);
        const response = yield* makeMappingRequest([
          { idType: "TICKER", idValue: ticker },
        ]);
        const body =
          yield* HttpClientResponse.schemaBodyJson(OpenFigiResponse)(response);

        return yield* decodeMappingResult(ticker, body);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.retry({
            while: isTransient,
            times: 3,
            schedule: Effect.Schedule.exponential("500 millis"),
          }),
          Effect.Effect.retry({
            while: isRateLimited,
            times: 2,
            schedule: Effect.Schedule.fixed("61 seconds"),
          }),
          Effect.Effect.mapError(
            (cause: unknown): OpenFigiNotFoundError | OpenFigiError =>
              cause instanceof OpenFigiNotFoundError ||
              cause instanceof OpenFigiError
                ? cause
                : new OpenFigiError({ cause }),
          ),
        ),
    );

    const lookupByName = Effect.Effect.fn("entity.openfigi.lookupByName")(
      function* (name: string) {
        yield* annotateCurrentSpan("name", name);
        const response = yield* makeSearchRequest(name);
        const body = yield* HttpClientResponse.schemaBodyJson(
          OpenFigiSearchResponse,
        )(response);

        if (body.error) {
          return yield* Effect.Effect.fail(
            new OpenFigiError({ cause: body.error }),
          );
        }

        // Warn when more pages are available - we don't fetch them automatically
        if (body.next) {
          yield* Effect.Effect.logWarning(
            `OpenFIGI pagination: More results available (next cursor: ${body.next}). Only first page returned.`,
          );
        }

        return (body.data ?? []).map(toOpenFigiResult);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.retry({
            while: isTransient,
            times: 3,
            schedule: Effect.Schedule.exponential("500 millis"),
          }),
          Effect.Effect.retry({
            while: isRateLimited,
            times: 2,
            schedule: Effect.Schedule.fixed("61 seconds"),
          }),
          Effect.Effect.mapError(
            (cause: unknown) => new OpenFigiError({ cause }),
          ),
        ),
    );

    return OpenFigiClient.of({ lookupByTicker, lookupByName });
  }).pipe(
    Effect.Effect.mapError((cause: unknown) => new OpenFigiError({ cause })),
  ),
);
