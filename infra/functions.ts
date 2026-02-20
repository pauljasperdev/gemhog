import { podcastBucket } from "./bucket";
import { DATABASE_URL_POOLER } from "./neon";
import { secrets } from "./secrets";

export const syncEpisodesDaily = new sst.aws.Function("SyncEpisodesDaily", {
  handler: "apps/functions/src/sync-episodes-daily.handler",
  link: [podcastBucket],
  environment: {
    DATABASE_URL_POOLER,
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
    DATABASE_URL_POOLER,
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
      permissions: [
        {
          actions: ["lambda:InvokeFunction"],
          resources: [syncEpisodesDaily.arn, syncEpisodesWeekly.arn],
        },
      ],
      environment: {
        SYNC_DAILY_FUNCTION_NAME: syncEpisodesDaily.name,
        SYNC_WEEKLY_FUNCTION_NAME: syncEpisodesWeekly.name,
      },
    })
  : undefined;
