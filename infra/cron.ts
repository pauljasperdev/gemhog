import { syncEpisodesDaily } from "./functions";

export const episodeSyncDailyCron = new sst.aws.Cron("EpisodeSyncDailyCron", {
  function: syncEpisodesDaily.arn,
  schedule: "cron(0 2 * * ? *)", // 02:00 UTC = 03:00 CET
});
