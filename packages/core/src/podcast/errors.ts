import * as Effect from "effect";

export class PodscanError extends Effect.Data.TaggedError("PodscanError")<{
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
