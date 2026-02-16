import { secrets } from "./secrets";

export const episodeSyncCron = new sst.aws.Cron("EpisodeSyncCron", {
  function: {
    handler: "apps/functions/src/sync-episodes.handler",
    environment: {
      DATABASE_URL: $dev
        ? "postgresql://postgres:password@localhost:5432/gemhog"
        : secrets.DatabaseUrlPooler.value,
      SST_STAGE: $app.stage,
      PODSCAN_API_TOKEN: secrets.PodscanApiToken.value,
      PODSCAN_BASE_URL: "https://podscan.fm/api/v1",
    },
  },
  schedule: "cron(0 2 * * ? *)", // 02:00 UTC = 03:00 CET
});
