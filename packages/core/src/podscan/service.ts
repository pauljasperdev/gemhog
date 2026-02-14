import * as Effect from "effect";
import type { PodScanError } from "./errors";
import type {
  PodScanChartPodcast,
  PodScanEpisode,
  PodScanPagination,
} from "./schema";

interface PodScanServiceSchape {
  readonly getTop: (
    category: string,
    limit: number,
  ) => Effect.Effect.Effect<
    ReadonlyArray<PodScanChartPodcast>,
    PodScanError,
    never
  >;

  readonly getLatest: (
    podcastId: string,
    limit?: number,
  ) => Effect.Effect.Effect<
    {
      readonly episodes: ReadonlyArray<PodScanEpisode>;
      readonly pagination: PodScanPagination;
    },
    PodScanError,
    never
  >;
}

export class PodScanService extends Effect.Context.Tag(
  "@gemhog/core/podscan/PodScanService",
)<PodScanService, PodScanServiceSchape>() {}
