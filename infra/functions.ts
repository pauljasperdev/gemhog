import { podcastBucket } from "./bucket";
import { secrets } from "./secrets";
import { DATABASE_URL_POOLER } from "./sql";

export const syncEpisodesDaily = new sst.aws.Function("SyncEpisodesDaily", {
  runtime: "nodejs22.x",
  handler: "apps/functions/src/sync-episodes-daily.handler",
  timeout: "3 minutes",
  link: [podcastBucket],
  environment: {
    DATABASE_URL_POOLER,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
    PODCAST_BUCKET_NAME: podcastBucket.name,
    SENTRY_DSN: secrets.SentryDsn.value,
  },
});

export const backfillEpisodes = new sst.aws.Function("BackfillEpisodes", {
  runtime: "nodejs22.x",
  handler: "apps/functions/src/backfill-episodes.handler",
  timeout: "15 minutes", // 5 podcasts × 10 pages = 50 requests, well within trial limits
  link: [podcastBucket],
  environment: {
    DATABASE_URL_POOLER,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
    PODCAST_BUCKET_NAME: podcastBucket.name,
    SENTRY_DSN: secrets.SentryDsn.value,
  },
});

export const trigger = new sst.aws.Function("Trigger", {
  runtime: "nodejs22.x",
  handler: "apps/functions/src/trigger-sync.handler",
  url: true,
  permissions: [
    {
      actions: ["lambda:InvokeFunction"],
      resources: [backfillEpisodes.arn],
    },
  ],
  environment: {
    BACKFILL_FUNCTION_NAME: backfillEpisodes.name,
    SENTRY_DSN: secrets.SentryDsn.value,
  },
});
