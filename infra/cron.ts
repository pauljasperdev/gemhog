import { syncEpisodes } from "./functions";

export const episodeSyncCron = new sst.aws.Cron("EpisodeSyncCron", {
  function: syncEpisodes.arn,
  schedule: "cron(0 2 * * ? *)", // 02:00 UTC = 03:00 CET
});
