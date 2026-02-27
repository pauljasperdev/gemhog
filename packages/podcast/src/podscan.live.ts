import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect";
import { PodscanError } from "./errors";
import { PodscanService } from "./podscan";
import {
  PodscanEpisodesResponse,
  PodscanPodcastDetailResponse,
  PodscanTopPodcastsResponse,
} from "./schema";

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

export const PodscanServiceLive = Effect.Layer.scoped(
  PodscanService,
  Effect.Effect.gen(function* () {
    const token = yield* Effect.Config.redacted("PODSCAN_API_TOKEN");
    const url = yield* Effect.Config.string("PODSCAN_BASE_URL").pipe(
      Effect.Config.withDefault("https://api.podscan.fm/v1"),
    );
    const limiter = yield* Effect.RateLimiter.make({
      limit: 10,
      interval: "1 minutes",
    });
    const semaphore = yield* Effect.Effect.makeSemaphore(5);
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    const query = (path: string) =>
      semaphore.withPermits(1)(
        limiter(
          HttpClientRequest.get(path).pipe(
            HttpClientRequest.prependUrl(url),
            HttpClientRequest.bearerToken(Effect.Redacted.value(token)),
            client.execute,
          ),
        ),
      );

    return PodscanService.of({
      getTop: (category, limit) =>
        Effect.Effect.gen(function* () {
          const response = yield* query(
            `/charts/apple/us/${category}/top?limit=${String(limit)}`,
          );
          const body = yield* HttpClientResponse.schemaBodyJson(
            PodscanTopPodcastsResponse,
          )(response);
          return body.podcasts;
        }).pipe(
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
            (cause: unknown) => new PodscanError({ cause }),
          ),
        ),

      getLatest: (podcastId, limit = 25, since?, page?) =>
        Effect.Effect.gen(function* () {
          let url = `/podcasts/${podcastId}/episodes?limit=${String(limit)}&show_only_fully_processed=true`;
          if (since !== undefined) url += `&since=${since}`;
          if (page !== undefined) url += `&page=${String(page)}`;
          const response = yield* query(url);
          return yield* HttpClientResponse.schemaBodyJson(
            PodscanEpisodesResponse,
          )(response);
        }).pipe(
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
            (cause: unknown) => new PodscanError({ cause }),
          ),
        ),

      getPodcast: (podcastId) =>
        Effect.Effect.gen(function* () {
          const response = yield* query(`/podcasts/${podcastId}`);
          const body = yield* HttpClientResponse.schemaBodyJson(
            PodscanPodcastDetailResponse,
          )(response);
          return body.podcast;
        }).pipe(
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
            (cause: unknown) => new PodscanError({ cause }),
          ),
        ),
    });
  }).pipe(
    Effect.Effect.mapError((cause: unknown) => new PodscanError({ cause })),
  ),
);
