import { Schema } from "effect";

// PodScanPodcast
export const PodScanPodcast = Schema.Struct({
  podcast_id: Schema.String,
  podcast_name: Schema.String,
  podcast_url: Schema.String,
  podcast_reach_score: Schema.NullOr(Schema.Number),
});

export type PodScanPodcast = Schema.Schema.Type<typeof PodScanPodcast>;

// PodScanEpisode
export const PodScanEpisode = Schema.Struct({
  episode_id: Schema.String,
  episode_title: Schema.String,
  episode_url: Schema.String,
  episode_audio_url: Schema.NullOr(Schema.String),
  episode_image_url: Schema.NullOr(Schema.String),
  episode_duration: Schema.NullOr(Schema.Number),
  episode_word_count: Schema.NullOr(Schema.Number),
  episode_transcript: Schema.NullOr(Schema.String),
  episode_description: Schema.NullOr(Schema.String),
  episode_categories: Schema.Array(
    Schema.Struct({
      category_id: Schema.String,
      category_name: Schema.String,
    }),
  ),
  podcast: PodScanPodcast,
  posted_at: Schema.NullOr(Schema.String),
  created_at: Schema.String,
  updated_at: Schema.String,
});

export type PodScanEpisode = Schema.Schema.Type<typeof PodScanEpisode>;

// PodScanChartPodcast
export const PodScanChartPodcast = Schema.Struct({
  rank: Schema.Number,
  name: Schema.String,
  publisher: Schema.String,
  movement: Schema.String,
  podcast_id: Schema.NullOr(Schema.String),
  thumbnail: Schema.NullOr(Schema.String),
  audience_size: Schema.NullOr(Schema.Number),
  rating: Schema.NullOr(Schema.Number),
  episode_count: Schema.NullOr(Schema.Number),
  last_posted_at: Schema.NullOr(Schema.Number),
  frequency: Schema.NullOr(Schema.String),
});

export type PodScanChartPodcast = Schema.Schema.Type<
  typeof PodScanChartPodcast
>;

export const PodScanTopPodcastsResponse = Schema.Struct({
  podcasts: Schema.Array(PodScanChartPodcast),
});

const PodScanPagination = Schema.Struct({
  total: Schema.Number,
  per_page: Schema.Number,
  current_page: Schema.Number,
  last_page: Schema.Number,
  from: Schema.NullOr(Schema.Number),
  to: Schema.NullOr(Schema.Number),
});

export type PodScanPagination = Schema.Schema.Type<typeof PodScanPagination>;

export const PodScanEpisodesResponse = Schema.Struct({
  episodes: Schema.Array(PodScanEpisode),
  pagination: PodScanPagination,
});
