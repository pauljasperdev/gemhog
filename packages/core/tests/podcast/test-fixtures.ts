import type {
  PodscanEpisode,
  PodscanPodcastDetail,
} from "../../src/podcast/schema";

/**
 * Factory function to create mock PodscanPodcastDetail objects for testing.
 * Provides sensible defaults for all 27 fields and accepts partial overrides.
 */
export function createMockPodcastDetail(
  overrides?: Partial<PodscanPodcastDetail>,
): PodscanPodcastDetail {
  const timestamp = Date.now();

  return {
    podcast_id: `test-podcast-${timestamp}`,
    podcast_guid: `test-guid-${timestamp}`,
    podcast_name: "Test Podcast",
    podcast_url: "https://example.com/test-podcast",
    podcast_description:
      "A test podcast for testing the getPodcast endpoint with all 27 fields populated.",
    podcast_image_url: "https://example.com/test-podcast-image.jpg",
    publisher_name: "Test Publisher",
    is_active: true,
    rss_url: "https://example.com/test-podcast/feed.xml",
    episode_count: 100,
    last_posted_at: "2024-02-14T15:30:00Z",
    language: "en",
    region: "US",
    last_scanned_at: "2024-02-14T16:00:00Z",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-02-14T16:00:00Z",
    is_duplicate: false,
    is_duplicate_of: null,
    podcast_itunes_id: "123456789",
    podcast_spotify_id: "spotify:show:test123",
    podcast_reach_score: 8500,
    podcast_has_guests: true,
    podcast_has_sponsors: true,
    podcast_categories: ["Technology", "Business"],
    podcast_iab_categories: ["Technology"],
    reach: {
      monthly_listeners: 50000,
      engagement_rate: 0.85,
    },
    brand_safety: {
      safety_score: 95,
      flagged_content: false,
    },
    ...overrides,
  };
}

/**
 * Factory function to create mock PodscanEpisode objects for testing.
 * Provides sensible defaults for all 21 fields plus nested podcast object,
 * and accepts partial overrides.
 */
export function createMockEpisode(
  overrides?: Partial<PodscanEpisode>,
): PodscanEpisode {
  const timestamp = Date.now();

  return {
    episode_id: `test-episode-${timestamp}`,
    episode_title: "Test Episode",
    episode_url: "https://example.com/test-episode",
    episode_audio_url: "https://example.com/test-audio.mp3",
    episode_image_url: "https://example.com/test-image.jpg",
    episode_duration: 3600,
    episode_word_count: 5000,
    episode_transcript:
      "This is a test transcript for testing. Welcome to the podcast. Today we discuss important topics.",
    episode_description: "A test episode for testing purposes.",
    episode_categories: {
      category_id: "cat-1",
      category_name: "Technology",
    },
    episode_fully_processed: true,
    episode_guid: `test-episode-guid-${timestamp}`,
    episode_has_guests: true,
    episode_has_sponsors: false,
    episode_permalink: "https://example.com/test-episode-permalink",
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
      podcast_id: "test-podcast-1",
      podcast_name: "Test Podcast",
      podcast_url: "https://example.com/test-podcast",
    },
    posted_at: "2024-02-14T10:00:00Z",
    created_at: "2024-02-14T10:00:00Z",
    updated_at: "2024-02-14T10:00:00Z",
    ...overrides,
  };
}
