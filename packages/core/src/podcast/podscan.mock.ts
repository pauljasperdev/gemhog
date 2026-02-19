import * as Effect from "effect";
import { PodscanService } from "./podscan";
import type {
  PodscanChartPodcast,
  PodscanEpisode,
  PodscanPagination,
  PodscanPodcastDetail,
} from "./schema";

const mockChartPodcasts: ReadonlyArray<PodscanChartPodcast> = [
  {
    rank: 1,
    name: "Mock Podcast Alpha",
    publisher: "Mock Publisher",
    movement: "up",
    podcast_id: "mock-podcast-1",
    thumbnail: "https://example.com/thumb1.jpg",
    audience_size: 50000,
    rating: 4.8,
    episode_count: 150,
    last_posted_at: 1707900000,
    frequency: "weekly",
  },
  {
    rank: 2,
    name: "Mock Podcast Beta",
    publisher: "Another Publisher",
    movement: "stable",
    podcast_id: "mock-podcast-2",
    thumbnail: "https://example.com/thumb2.jpg",
    audience_size: 35000,
    rating: 4.5,
    episode_count: 120,
    last_posted_at: 1707800000,
    frequency: "bi-weekly",
  },
];

const mockPagination: PodscanPagination = {
  total: 100,
  per_page: 10,
  current_page: 1,
  last_page: 10,
  from: 1,
  to: 10,
};

const mockPodcastDetail: PodscanPodcastDetail = {
  podcast_id: "mock-podcast-detail-1",
  podcast_guid: "mock-guid-12345",
  podcast_name: "Mock Podcast Detail",
  podcast_url: "https://example.com/podcast-detail",
  podcast_description:
    "A comprehensive mock podcast for testing the getPodcast endpoint with all 27 fields populated.",
  podcast_image_url: "https://example.com/podcast-detail-image.jpg",
  publisher_name: "Mock Publisher Detail",
  is_active: true,
  rss_url: "https://example.com/podcast-detail/feed.xml",
  episode_count: 250,
  last_posted_at: "2024-02-14T15:30:00Z",
  language: "en",
  region: "US",
  last_scanned_at: "2024-02-14T16:00:00Z",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2024-02-14T16:00:00Z",
  is_duplicate: false,
  is_duplicate_of: null,
  podcast_itunes_id: "123456789",
  podcast_spotify_id: "spotify:show:mock123",
  podcast_reach_score: 8500,
  podcast_has_guests: true,
  podcast_has_sponsors: true,
  podcast_categories: [
    { category_id: "ct_mock_tech", category_name: "Technology" },
    { category_id: "ct_mock_biz", category_name: "Business" },
    { category_id: "ct_mock_entre", category_name: "Entrepreneurship" },
  ],
  podcast_iab_categories: [
    {
      iab_category_id: "ic_mock_tech",
      unique_id: "686",
      name: "Technology & Computing",
      tier_path: "Technology & Computing",
      confidence: "0.9500",
    },
    {
      iab_category_id: "ic_mock_biz",
      unique_id: "52",
      name: "Business and Finance",
      tier_path: "Business and Finance",
      confidence: "0.9200",
    },
  ],
  reach: {
    monthly_listeners: 50000,
    engagement_rate: 0.85,
  },
  brand_safety: {
    safety_score: 95,
    flagged_content: false,
  },
};

const mockEpisodes: ReadonlyArray<PodscanEpisode> = [
  {
    episode_id: "mock-episode-1",
    episode_title: "Mock Episode 1: Getting Started",
    episode_url: "https://example.com/episode1",
    episode_audio_url: "https://example.com/audio1.mp3",
    episode_image_url: "https://example.com/image1.jpg",
    episode_duration: 3600,
    episode_word_count: 5000,
    episode_transcript:
      "This is a mock transcript for testing. Welcome to the podcast. Today we discuss important topics. This mock transcript contains enough content to be realistic.",
    episode_description: "A mock episode for testing purposes.",
    episode_categories: [
      {
        category_id: "cat-1",
        category_name: "Technology",
      },
    ],
    episode_fully_processed: true,
    episode_guid: "mock-guid-1",
    episode_has_guests: true,
    episode_has_sponsors: false,
    episode_permalink: "https://example.com/episode1-permalink",
    episode_transcript_word_level_timestamps: {},
    metadata: {},
    topics: [
      {
        topic_id: "topic-1",
        topic_name: "AI",
        topic_name_normalized: "ai",
      },
    ],
    podcast: {
      podcast_id: "mock-podcast-1",
      podcast_name: "Mock Podcast Alpha",
      podcast_url: "https://example.com/podcast1",
    },
    posted_at: "2024-02-14T10:00:00Z",
    created_at: "2024-02-14T10:00:00Z",
    updated_at: "2024-02-14T10:00:00Z",
  },
  {
    episode_id: "mock-episode-2",
    episode_title: "Mock Episode 2: Advanced Topics",
    episode_url: "https://example.com/episode2",
    episode_audio_url: "https://example.com/audio2.mp3",
    episode_image_url: "https://example.com/image2.jpg",
    episode_duration: 4200,
    episode_word_count: 6000,
    episode_transcript:
      "This is another mock transcript for testing. We continue our discussion. More content here for realism. Testing the transcript field.",
    episode_description: "Another mock episode for testing.",
    episode_categories: [
      {
        category_id: "cat-2",
        category_name: "Business",
      },
    ],
    episode_fully_processed: true,
    episode_guid: "mock-guid-2",
    episode_has_guests: false,
    episode_has_sponsors: true,
    episode_permalink: "https://example.com/episode2-permalink",
    episode_transcript_word_level_timestamps: {},
    metadata: {},
    topics: [
      {
        topic_id: "topic-2",
        topic_name: "Entrepreneurship",
        topic_name_normalized: "entrepreneurship",
      },
    ],
    podcast: {
      podcast_id: "mock-podcast-2",
      podcast_name: "Mock Podcast Beta",
      podcast_url: "https://example.com/podcast2",
    },
    posted_at: "2024-02-13T10:00:00Z",
    created_at: "2024-02-13T10:00:00Z",
    updated_at: "2024-02-13T10:00:00Z",
  },
];

const resolvePodcastSnapshot = (podcastId: string) => {
  const chartPodcast = mockChartPodcasts.find(
    (podcast) => podcast.podcast_id === podcastId,
  );
  return {
    id: podcastId,
    name: chartPodcast?.name ?? mockPodcastDetail.podcast_name,
    url: chartPodcast?.podcast_id
      ? `https://example.com/podcasts/${chartPodcast.podcast_id}`
      : mockPodcastDetail.podcast_url,
    publisher: chartPodcast?.publisher ?? mockPodcastDetail.publisher_name,
  };
};

const buildPodcastDetail = (podcastId: string): PodscanPodcastDetail => {
  const snapshot = resolvePodcastSnapshot(podcastId);
  return {
    ...mockPodcastDetail,
    podcast_id: snapshot.id,
    podcast_name: snapshot.name,
    podcast_url: snapshot.url,
    publisher_name: snapshot.publisher,
  };
};

const buildLatestEpisodes = (
  podcastId: string,
): ReadonlyArray<PodscanEpisode> => {
  const snapshot = resolvePodcastSnapshot(podcastId);
  return mockEpisodes.map((episode, index) => ({
    ...episode,
    episode_id: `${podcastId}-episode-${String(index + 1)}`,
    episode_guid: `${podcastId}-guid-${String(index + 1)}`,
    episode_permalink: `https://example.com/podcasts/${podcastId}/episodes/${String(index + 1)}`,
    podcast: {
      podcast_id: snapshot.id,
      podcast_name: snapshot.name,
      podcast_url: snapshot.url,
    },
  }));
};

export const MockPodscanService = Effect.Layer.succeed(
  PodscanService,
  PodscanService.of({
    getTop: (_category, _limit) => Effect.Effect.succeed(mockChartPodcasts),
    getLatest: (podcastId, _limit) =>
      Effect.Effect.succeed({
        episodes: buildLatestEpisodes(podcastId),
        pagination: mockPagination,
      }),
    getPodcast: (podcastId) =>
      Effect.Effect.succeed(buildPodcastDetail(podcastId)),
  }),
);
