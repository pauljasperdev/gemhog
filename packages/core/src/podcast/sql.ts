import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const podcast = pgTable(
  "podcast",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    podscanPodcastId: text("podscan_podcast_id").notNull().unique(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    guid: text("guid"),
    description: text("description"),
    imageUrl: text("image_url"),
    publisherName: text("publisher_name"),
    rssUrl: text("rss_url"),
    language: text("language"),
    region: text("region"),
    itunesId: text("itunes_id"),
    spotifyId: text("spotify_id"),
    isDuplicateOf: text("is_duplicate_of"),
    lastPostedAt: timestamp("last_posted_at"),
    lastScannedAt: timestamp("last_scanned_at"),
    podscanCreatedAt: timestamp("podscan_created_at"),
    podscanUpdatedAt: timestamp("podscan_updated_at"),
    episodeCount: integer("episode_count"),
    reachScore: integer("reach_score"),
    isActive: boolean("is_active"),
    isDuplicate: boolean("is_duplicate"),
    hasGuests: boolean("has_guests"),
    hasSponsors: boolean("has_sponsors"),
    categories: jsonb("categories"),
    iabCategories: jsonb("iab_categories"),
    reach: jsonb("reach"),
    brandSafety: jsonb("brand_safety"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("podcast_podscan_podcast_id_idx").on(table.podscanPodcastId),
  ],
);

export const episode = pgTable(
  "episode",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    podscanEpisodeId: text("podscan_episode_id").notNull().unique(),
    podcastId: text("podcast_id")
      .notNull()
      .references(() => podcast.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    url: text("url").notNull(),
    imageUrl: text("image_url").notNull(),
    audioUrl: text("audio_url").notNull(),
    duration: integer("duration").notNull(),
    wordCount: integer("word_count").notNull(),
    postedAt: text("posted_at"),
    categoryId: text("category_id"),
    categoryName: text("category_name"),
    transcript: text("transcript").notNull(),
    fullyProcessed: boolean("fully_processed").notNull(),
    guid: text("guid").notNull(),
    hasGuests: boolean("has_guests").notNull(),
    hasSponsors: boolean("has_sponsors").notNull(),
    permalink: text("permalink"),
    metadata: jsonb("metadata"),
    topics: jsonb("topics"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("episode_podcast_id_idx").on(table.podcastId),
    index("episode_podscan_episode_id_idx").on(table.podscanEpisodeId),
  ],
);

export type Podcast = typeof podcast.$inferSelect;
export type Episode = typeof episode.$inferSelect;
