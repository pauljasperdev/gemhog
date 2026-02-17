import { syncEpisodesDaily, syncEpisodesWeekly } from "./functions";

export const episodeSyncDailyCron = new sst.aws.Cron("EpisodeSyncDailyCron", {
  function: syncEpisodesDaily.arn,
  schedule: "cron(0 2 * * ? *)", // 02:00 UTC = 03:00 CET
});

export const episodeSyncWeeklyCron = new sst.aws.Cron("EpisodeSyncWeeklyCron", {
  function: syncEpisodesWeekly.arn,
  schedule: "cron(0 2 ? * SUN *)", // 02:00 UTC Sundays = 03:00 CET
});
