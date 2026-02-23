import { podcastBucket } from "./bucket";
import { secrets } from "./secrets";
import { DATABASE_URL_POOLER } from "./sql";

export const syncEpisodesDaily = new sst.aws.Function("SyncEpisodesDaily", {
  handler: "apps/functions/src/sync-episodes-daily.handler",
  timeout: "3 minutes",
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
  timeout: "3 minutes",
  link: [podcastBucket],
  environment: {
    DATABASE_URL_POOLER,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
    PODCAST_BUCKET_NAME: podcastBucket.name,
  },
});

export const trigger = new sst.aws.Function("Trigger", {
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
});
