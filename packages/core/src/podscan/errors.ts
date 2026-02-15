import * as Effect from "effect";

export class PodScanError extends Effect.Data.TaggedError("PodScanError")<{
  readonly cause: unknown;
}> {}

export class EpisodeNotFoundError extends Effect.Data.TaggedError(
  "EpisodeNotFoundError",
)<{
  identifier: string;
}> {}

export class PodcastRepositoryError extends Effect.Data.TaggedError(
  "PodcastRepositoryError",
)<{
  readonly cause: string;
}> {}

export class PodcastNotFoundError extends Effect.Data.TaggedError(
  "PodcastNotFoundError",
)<{
  identifier: string;
}> {}
