import type { SqlError } from "@effect/sql/SqlError";
import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import * as Effect from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import {
  EpisodeNotFoundError,
  PodcastNotFoundError,
  PodcastRepositoryError,
} from "./errors";
import { PodcastRepository } from "./repository";
import type { PodscanEpisodeResponse, PodscanPodcastDetail } from "./schema";
import { podscanEpisode, podscanPodcast } from "./sql";

export const PodcastRepositoryLive = Effect.Layer.effect(
  PodcastRepository,
  Effect.Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const upsertPodcastByPodscanId = Effect.Effect.fn(
      "podcast.repository.upsertPodcast",
    )(
      function* (data: PodscanPodcastDetail) {
        yield* annotateCurrentSpan("podscanPodcastId", data.podcast_id);

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
          .insert(podscanPodcast)
          .values(podcastData)
          .onConflictDoUpdate({
            target: podscanPodcast.podscanPodcastId,
            set: {
              ...podcastData,
              updatedAt: new Date(),
            },
          })
          .returning();

        // biome-ignore lint/style/noNonNullAssertion: Database upsert returns at least one row.
        return rows[0]!;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during podcast upsert: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    const upsertEpisodeByPodscanId = Effect.Effect.fn(
      "podcast.repository.upsertEpisode",
    )(
      function* (data: PodscanEpisodeResponse) {
        yield* annotateCurrentSpan("podscanEpisodeId", data.episode_id);

        const podcastRows = yield* db
          .select()
          .from(podscanPodcast)
          .where(eq(podscanPodcast.podscanPodcastId, data.podcast.podcast_id))
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
          .insert(podscanEpisode)
          .values(episodeData)
          .onConflictDoUpdate({
            target: podscanEpisode.podscanEpisodeId,
            set: {
              ...episodeData,
              updatedAt: new Date(),
            },
          })
          .returning();

        // biome-ignore lint/style/noNonNullAssertion: Database upsert returns at least one row.
        return rows[0]!;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episode upsert: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    const readPodcastById = Effect.Effect.fn(
      "podcast.repository.readPodcastById",
    )(
      function* (podcastId: string) {
        yield* annotateCurrentSpan("podcastId", podcastId);

        const rows = yield* db
          .select()
          .from(podscanPodcast)
          .where(eq(podscanPodcast.id, podcastId));

        const row = rows[0];
        if (!row) {
          return yield* Effect.Effect.fail(
            new PodcastNotFoundError({ identifier: podcastId }),
          );
        }
        return row;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during podcast read: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    const readEpisodeById = Effect.Effect.fn(
      "podcast.repository.readEpisodeById",
    )(
      function* (episodeId: string) {
        yield* annotateCurrentSpan("episodeId", episodeId);

        const rows = yield* db
          .select()
          .from(podscanEpisode)
          .where(eq(podscanEpisode.id, episodeId));

        const row = rows[0];
        if (!row) {
          return yield* Effect.Effect.fail(
            new EpisodeNotFoundError({ identifier: episodeId }),
          );
        }
        return row;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episode read: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    const readEpisodesByPodcastId = Effect.Effect.fn(
      "podcast.repository.readEpisodesByPodcastId",
    )(
      function* (podcastId: string) {
        yield* annotateCurrentSpan("podcastId", podcastId);

        const rows = yield* db
          .select()
          .from(podscanEpisode)
          .where(eq(podscanEpisode.podcastId, podcastId));
        return rows;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episodes read: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    const episodeExistsByPodscanId = Effect.Effect.fn(
      "podcast.repository.episodeExists",
    )(
      function* (podscanEpisodeId: string) {
        yield* annotateCurrentSpan("podscanEpisodeId", podscanEpisodeId);

        const rows = yield* db
          .select({ id: podscanEpisode.id })
          .from(podscanEpisode)
          .where(eq(podscanEpisode.podscanEpisodeId, podscanEpisodeId));

        return rows.length > 0;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during episode exists check: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    const readPodcastByPodscanId = Effect.Effect.fn(
      "podcast.repository.readPodcastByPodscanId",
    )(
      function* (podscanPodcastId: string) {
        yield* annotateCurrentSpan("podscanPodcastId", podscanPodcastId);

        const rows = yield* db
          .select()
          .from(podscanPodcast)
          .where(eq(podscanPodcast.podscanPodcastId, podscanPodcastId));

        const row = rows[0];
        if (!row) {
          return yield* Effect.Effect.fail(
            new PodcastNotFoundError({ identifier: podscanPodcastId }),
          );
        }
        return row;
      },
      (effect) =>
        effect.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) => {
            const cause = `Database operation failed during podcast read by podscan ID: ${sqlError.message}`;
            return Effect.Effect.fail(new PodcastRepositoryError({ cause }));
          }),
        ),
    );

    return PodcastRepository.of({
      upsertPodcastByPodscanId,
      upsertEpisodeByPodscanId,
      readPodcastById,
      readEpisodeById,
      readEpisodesByPodcastId,
      episodeExistsByPodscanId,
      readPodcastByPodscanId,
    });
  }),
);
