import { secrets } from "./secrets";

export const syncEpisodesDaily = new sst.aws.Function("SyncEpisodesDaily", {
  handler: "apps/functions/src/sync-episodes-daily.handler",
  environment: {
    DATABASE_URL: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrlPooler.value,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
  },
});

export const syncEpisodesWeekly = new sst.aws.Function("SyncEpisodesWeekly", {
  handler: "apps/functions/src/sync-episodes-weekly.handler",
  environment: {
    DATABASE_URL: $dev
      ? "postgresql://postgres:password@localhost:5432/gemhog"
      : secrets.DatabaseUrlPooler.value,
    SST_STAGE: $app.stage,
    PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
    PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
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
