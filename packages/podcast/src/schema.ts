import { Schema } from "effect";

// PodscanPodcast
export const PodscanPodcast = Schema.Struct({
  podcast_id: Schema.String,
  podcast_name: Schema.String,
  podcast_url: Schema.String,
});

export type PodscanPodcast = Schema.Schema.Type<typeof PodscanPodcast>;

// PodscanEpisode
export const PodscanEpisode = Schema.Struct({
  episode_id: Schema.String,
  episode_title: Schema.String,
  episode_url: Schema.String,
  episode_audio_url: Schema.String,
  episode_image_url: Schema.String,
  episode_duration: Schema.Number,
  episode_word_count: Schema.Number,
  episode_transcript: Schema.String,
  episode_description: Schema.String,
  episode_categories: Schema.Array(
    Schema.Struct({
      category_id: Schema.String,
      category_name: Schema.String,
    }),
  ),
  episode_fully_processed: Schema.Boolean,
  episode_guid: Schema.String,
  episode_has_guests: Schema.Boolean,
  episode_has_sponsors: Schema.Boolean,
  episode_permalink: Schema.NullOr(Schema.String),
  episode_transcript_word_level_timestamps: Schema.Unknown,
  metadata: Schema.Unknown,
  topics: Schema.Array(
    Schema.Struct({
      topic_id: Schema.String,
      topic_name: Schema.String,
      topic_name_normalized: Schema.String,
    }),
  ),
  podcast: PodscanPodcast,
  posted_at: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
});

export type PodscanEpisode = Schema.Schema.Type<typeof PodscanEpisode>;

// PodscanChartPodcast
export const PodscanChartPodcast = Schema.Struct({
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

export type PodscanChartPodcast = Schema.Schema.Type<
  typeof PodscanChartPodcast
>;

// PodscanPodcastDetail
export const PodscanPodcastDetail = Schema.Struct({
  podcast_id: Schema.String,
  podcast_guid: Schema.String,
  podcast_name: Schema.String,
  podcast_url: Schema.String,
  podcast_description: Schema.String,
  podcast_image_url: Schema.String,
  publisher_name: Schema.String,
  is_active: Schema.Boolean,
  rss_url: Schema.String,
  episode_count: Schema.Number,
  last_posted_at: Schema.String,
  language: Schema.String,
  region: Schema.String,
  last_scanned_at: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
  is_duplicate: Schema.Boolean,
  is_duplicate_of: Schema.NullOr(Schema.String),
  podcast_itunes_id: Schema.NullOr(Schema.String),
  podcast_spotify_id: Schema.NullOr(Schema.String),
  podcast_reach_score: Schema.NullOr(Schema.Number),
  podcast_has_guests: Schema.NullOr(Schema.Boolean),
  podcast_has_sponsors: Schema.NullOr(Schema.Boolean),
  podcast_categories: Schema.Array(
    Schema.Struct({
      category_id: Schema.String,
      category_name: Schema.String,
    }),
  ),
  podcast_iab_categories: Schema.Array(
    Schema.Struct({
      iab_category_id: Schema.String,
      unique_id: Schema.String,
      name: Schema.String,
      tier_path: Schema.String,
      confidence: Schema.String,
    }),
  ),
  reach: Schema.Unknown,
  brand_safety: Schema.NullOr(Schema.Unknown),
});

export type PodscanPodcastDetail = Schema.Schema.Type<
  typeof PodscanPodcastDetail
>;

export const PodscanPodcastDetailResponse = Schema.Struct({
  podcast: PodscanPodcastDetail,
});

export const PodscanTopPodcastsResponse = Schema.Struct({
  podcasts: Schema.Array(PodscanChartPodcast),
});

const PodscanPagination = Schema.Struct({
  total: Schema.Number,
  per_page: Schema.Number,
  current_page: Schema.Number,
  last_page: Schema.Number,
  from: Schema.Number,
  to: Schema.Number,
});

export type PodscanPagination = Schema.Schema.Type<typeof PodscanPagination>;

export const PodscanEpisodesResponse = Schema.Struct({
  episodes: Schema.Array(PodscanEpisode),
  pagination: PodscanPagination,
});
