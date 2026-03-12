import { Effect } from "effect";
import { PodscanLayer, PodscanService } from "../src";
import type { PodscanChartPodcastResponse } from "../src/schema";

const WEEKLY_THRESHOLD = 2.5; // episodes per week
const DAILY_THRESHOLD = 5.0; // episodes per week
const TOP_COUNT = 10;
const FETCH_LIMIT = 100;

const parseFrequency = (freq: string | null): number | null => {
  if (!freq) return null;
  const parsed = Number.parseFloat(freq);
  return Number.isNaN(parsed) ? null : parsed;
};

const filterWeekly = (podcast: PodscanChartPodcastResponse): boolean => {
  const freq = parseFrequency(podcast.frequency);
  return freq !== null && freq < WEEKLY_THRESHOLD;
};

const filterDaily = (podcast: PodscanChartPodcastResponse): boolean => {
  const freq = parseFrequency(podcast.frequency);
  return freq !== null && freq >= DAILY_THRESHOLD;
};

const sortByAudience = (
  a: PodscanChartPodcastResponse,
  b: PodscanChartPodcastResponse,
): number => {
  const aSize = a.audience_size ?? 0;
  const bSize = b.audience_size ?? 0;
  return bSize - aSize;
};

const formatAudience = (size: number | null): string => {
  if (size === null) return "N/A";
  return size.toLocaleString();
};

const formatFrequency = (freq: string | null): string => {
  const parsed = parseFrequency(freq);
  return parsed !== null ? parsed.toFixed(2) : "N/A";
};

const formatPodcast = (
  podcast: PodscanChartPodcastResponse,
  index: number,
): string => {
  return `${index}. ${podcast.name}
   Publisher: ${podcast.publisher}
   Podcast ID: ${podcast.podcast_id ?? "N/A"}
   Frequency: ${formatFrequency(podcast.frequency)} episodes/week
   Audience: ${formatAudience(podcast.audience_size)}
   Episodes: ${podcast.episode_count ?? "N/A"}`;
};

const program = Effect.gen(function* () {
  const podScan = yield* PodscanService;
  const shows = yield* podScan.getTop("Investing", FETCH_LIMIT);

  const weekly = shows
    .filter(filterWeekly)
    .sort(sortByAudience)
    .slice(0, TOP_COUNT);

  const daily = shows
    .filter(filterDaily)
    .sort(sortByAudience)
    .slice(0, TOP_COUNT);

  yield* Effect.sync(() => {
    console.log("\n=== TOP 10 WEEKLY INVESTING PODCASTS ===\n");
    weekly.forEach((podcast, index) => {
      console.log(formatPodcast(podcast, index + 1));
      console.log();
    });

    console.log("\n=== TOP 10 DAILY INVESTING PODCASTS ===\n");
    daily.forEach((podcast, index) => {
      console.log(formatPodcast(podcast, index + 1));
      console.log();
    });

    console.log("\n=== SUMMARY: PODCAST IDs ===\n");
    console.log("Weekly Podcast IDs:");
    weekly.forEach((podcast) => {
      console.log(`  ${podcast.podcast_id ?? "N/A"}  # ${podcast.name}`);
    });

    console.log("\nDaily Podcast IDs:");
    daily.forEach((podcast) => {
      console.log(`  ${podcast.podcast_id ?? "N/A"}  # ${podcast.name}`);
    });
    console.log();
  });
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PodscanLayer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
