import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect";
import { SqlLive } from "../sql";
import { PodscanError } from "./errors";
import { PodscanService } from "./podscan";
import {
  PodscanEpisodesResponse,
  PodscanPodcastDetailResponse,
  PodscanTopPodcastsResponse,
} from "./schema";

export const PodscanServiceLive = Effect.Layer.effect(
  PodscanService,
  Effect.Effect.gen(function* () {
    const token = yield* Effect.Config.redacted("PODSCAN_API_TOKEN");
    const url = yield* Effect.Config.string("PODSCAN_BASE_URL").pipe(
      Effect.Config.withDefault("https://api.podscan.fm/v1"),
    );
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    const query = (path: string) =>
      HttpClientRequest.get(path).pipe(
        HttpClientRequest.prependUrl(url),
        HttpClientRequest.bearerToken(Effect.Redacted.value(token)),
        client.execute,
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
          Effect.Effect.mapError(
            (cause: unknown) => new PodscanError({ cause }),
          ),
        ),

      getLatest: (podcastId, limit = 25) =>
        Effect.Effect.gen(function* () {
          const response = yield* query(
            `/podcasts/${podcastId}/episodes?limit=${String(limit)}`,
          );
          return yield* HttpClientResponse.schemaBodyJson(
            PodscanEpisodesResponse,
          )(response);
        }).pipe(
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
          Effect.Effect.mapError(
            (cause: unknown) => new PodscanError({ cause }),
          ),
        ),
    });
  }).pipe(
    Effect.Effect.mapError((cause: unknown) => new PodscanError({ cause })),
  ),
).pipe(
  Effect.Layer.provide(FetchHttpClient.layer),
  Effect.Layer.provide(SqlLive),
);
