import type { SqlError } from "@effect/sql/SqlError";
import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import * as Effect from "effect";
import {
  EpisodeNotFoundError,
  PodcastNotFoundError,
  PodcastRepositoryError,
} from "./errors";
import { PodcastRepository } from "./repository";
import type { PodscanEpisode, PodscanPodcastDetail } from "./schema";
import { type Episode, episode, type Podcast, podcast } from "./sql";

export const PodcastRepositoryLive = Effect.Layer.effect(
  PodcastRepository,
  Effect.Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const upsertPodcastByPodscanId = (
      data: PodscanPodcastDetail,
    ): Effect.Effect.Effect<Podcast, PodcastRepositoryError, never> =>
      Effect.Effect.gen(function* () {
        const podcastData = {
          podscanPodcastId: data.podcast_id,
          name: data.podcast_name,
          url: data.podcast_url,
          guid: data.podcast_guid,
          description: data.podcast_description,
          imageUrl: data.podcast_image_url,
          publisherName: data.publisher_name,
          rssUrl: data.rss_url,
          language: data.language,
          region: data.region,
          itunesId: data.podcast_itunes_id,
          spotifyId: data.podcast_spotify_id,
          isDuplicateOf: data.is_duplicate_of,
          lastPostedAt: new Date(data.last_posted_at),
          lastScannedAt: new Date(data.last_scanned_at),
          podscanCreatedAt: new Date(data.created_at),
          podscanUpdatedAt: new Date(data.updated_at),
          episodeCount: data.episode_count,
          reachScore: data.podcast_reach_score,
          isActive: data.is_active,
          isDuplicate: data.is_duplicate,
          hasGuests: data.podcast_has_guests,
          hasSponsors: data.podcast_has_sponsors,
          categories: data.podcast_categories,
          iabCategories: data.podcast_iab_categories,
          reach: data.reach,
          brandSafety: data.brand_safety,
        };

        const rows = yield* db
          .insert(podcast)
          .values(podcastData)
          .onConflictDoUpdate({
            target: podcast.podscanPodcastId,
            set: {
              ...podcastData,
              updatedAt: new Date(),
            },
          })
          .returning();

        // biome-ignore lint/style/noNonNullAssertion: Database upsert returns at least one row.
        return rows[0]!;
      }).pipe(
        Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
          const cause = `Database operation failed during podcast upsert: ${sqlError.message}`;
          return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
        }),
      );

    const upsertEpisodeByPodscanId = (
      data: PodscanEpisode,
    ): Effect.Effect.Effect<Episode, PodcastRepositoryError, never> =>
      Effect.Effect.gen(function* () {
        const podcastRows = yield* db
          .select()
          .from(podcast)
          .where(eq(podcast.podscanPodcastId, data.podcast.podcast_id))
          .pipe(
            Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
              const cause = `Database operation failed during podcast FK resolution: ${sqlError.message}`;
              return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
            }),
          );

        if (podcastRows.length === 0) {
          return yield* Effect.Effect.fail(
            new PodcastRepositoryError({
              cause: `Podcast not found for podscan ID: ${data.podcast.podcast_id}`,
            }),
          );
        }

        // biome-ignore lint/style/noNonNullAssertion: We checked length above
        const resolvedPodcast = podcastRows[0]!;

        const episodeData = {
          podscanEpisodeId: data.episode_id,
          podcastId: resolvedPodcast.id,
          title: data.episode_title,
          description: data.episode_description,
          url: data.episode_url,
          imageUrl: data.episode_image_url,
          audioUrl: data.episode_audio_url,
          duration: data.episode_duration,
          wordCount: data.episode_word_count,
          postedAt: data.posted_at,
          categories: data.episode_categories,
          transcript: data.episode_transcript,
          fullyProcessed: data.episode_fully_processed,
          guid: data.episode_guid,
          hasGuests: data.episode_has_guests,
          hasSponsors: data.episode_has_sponsors,
          permalink: data.episode_permalink,
          metadata: data.metadata,
          topics: data.topics,
        };

        const rows = yield* db
          .insert(episode)
          .values(episodeData)
          .onConflictDoUpdate({
            target: episode.podscanEpisodeId,
            set: {
              ...episodeData,
              updatedAt: new Date(),
            },
          })
          .returning();

        // biome-ignore lint/style/noNonNullAssertion: Database upsert returns at least one row.
        return rows[0]!;
      }).pipe(
        Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
          const cause = `Database operation failed during episode upsert: ${sqlError.message}`;
          return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
        }),
      );

    const readPodcastById = (
      podcastId: string,
    ): Effect.Effect.Effect<
      Podcast,
      PodcastRepositoryError | PodcastNotFoundError,
      never
    > =>
      db
        .select()
        .from(podcast)
        .where(eq(podcast.id, podcastId))
        .pipe(
          Effect.Effect.map((rows: Podcast[]) => rows[0]),
          Effect.Effect.flatMap((row) =>
            row
              ? Effect.Effect.succeed(row)
              : Effect.Effect.fail(
                  new PodcastNotFoundError({ identifier: podcastId }),
                ),
          ),
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during podcast read: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        );

    const readEpisodeById = (
      episodeId: string,
    ): Effect.Effect.Effect<
      Episode,
      PodcastRepositoryError | EpisodeNotFoundError,
      never
    > =>
      db
        .select()
        .from(episode)
        .where(eq(episode.id, episodeId))
        .pipe(
          Effect.Effect.map((rows: Episode[]) => rows[0]),
          Effect.Effect.flatMap((row) =>
            row
              ? Effect.Effect.succeed(row)
              : Effect.Effect.fail(
                  new EpisodeNotFoundError({ identifier: episodeId }),
                ),
          ),
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episode read: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        );

    const readEpisodesByPodcastId = (
      podcastId: string,
    ): Effect.Effect.Effect<
      ReadonlyArray<Episode>,
      PodcastRepositoryError,
      never
    > =>
      db
        .select()
        .from(episode)
        .where(eq(episode.podcastId, podcastId))
        .pipe(
          Effect.Effect.map((rows) => rows),
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episodes read: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        );

    const episodeExistsByPodscanId = (
      podscanEpisodeId: string,
    ): Effect.Effect.Effect<boolean, PodcastRepositoryError, never> =>
      db
        .select({ id: episode.id })
        .from(episode)
        .where(eq(episode.podscanEpisodeId, podscanEpisodeId))
        .pipe(
          Effect.Effect.map((rows) => rows.length > 0),
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episode exists check: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        );

    return PodcastRepository.of({
      upsertPodcastByPodscanId,
      upsertEpisodeByPodscanId,
      readPodcastById,
      readEpisodeById,
      readEpisodesByPodcastId,
      episodeExistsByPodscanId,
    });
  }),
);
