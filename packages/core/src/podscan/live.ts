import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect";

import { PodScanError } from "./errors";
import { PodScanEpisodesResponse, PodScanTopPodcastsResponse } from "./schema";
import { PodScanService } from "./service";

export const PodScanLive = Effect.Layer.effect(
  PodScanService,
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

    return PodScanService.of({
      getTop: (category, limit) =>
        Effect.Effect.gen(function* () {
          const response = yield* query(
            `/charts/apple/us/${category}/top?limit=${String(limit)}`,
          );
          const body = yield* HttpClientResponse.schemaBodyJson(
            PodScanTopPodcastsResponse,
          )(response);
          return body.podcasts;
        }).pipe(
          Effect.Effect.mapError(
            (cause: unknown) => new PodScanError({ cause }),
          ),
        ),

      getLatest: (podcastId, limit = 25) =>
        Effect.Effect.gen(function* () {
          const response = yield* query(
            `/podcasts/${podcastId}/episodes?limit=${String(limit)}`,
          );
          return yield* HttpClientResponse.schemaBodyJson(
            PodScanEpisodesResponse,
          )(response);
        }).pipe(
          Effect.Effect.mapError(
            (cause: unknown) => new PodScanError({ cause }),
          ),
        ),
    });
  }).pipe(
    Effect.Effect.mapError((cause: unknown) => new PodScanError({ cause })),
  ),
).pipe(Effect.Layer.provide(FetchHttpClient.layer));
