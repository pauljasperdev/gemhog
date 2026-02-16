import { secrets } from "./secrets";

export const syncEpisodes = new sst.aws.Function("SyncEpisodes", {
  handler: "apps/functions/src/sync-episodes.handler",
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
        SYNC_FUNCTION_NAME: syncEpisodes.name,
      },
    })
  : undefined;
