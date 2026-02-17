import { podcastBucket } from "./bucket";
import { secrets } from "./secrets";

export const syncEpisodesDaily = new sst.aws.Function("SyncEpisodesDaily", {
  handler: "apps/functions/src/sync-episodes-daily.handler",
  link: [podcastBucket],
  environment: {
    DATABASE_URL: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrlPooler.value,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
    PODCAST_BUCKET_NAME: podcastBucket.name,
  },
});

export const syncEpisodesWeekly = new sst.aws.Function("SyncEpisodesWeekly", {
  handler: "apps/functions/src/sync-episodes-weekly.handler",
  link: [podcastBucket],
  environment: {
    DATABASE_URL: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrlPooler.value,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
    PODCAST_BUCKET_NAME: podcastBucket.name,
  },
});

export const trigger = $dev
  ? new sst.aws.Function("Trigger", {
      handler: "apps/functions/src/trigger-sync.handler",
      url: true,
      environment: {
        SYNC_DAILY_FUNCTION_NAME: syncEpisodesDaily.name,
        SYNC_WEEKLY_FUNCTION_NAME: syncEpisodesWeekly.name,
      },
    })
  : undefined;
