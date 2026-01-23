import { secrets } from "./secrets";

export const neon = new sst.Linkable("Neon", {
  properties: {
    url: secrets.DatabaseUrl.value,
    urlPooler: secrets.DatabaseUrlPooler.value,
  },
});

new sst.x.DevCommand("Database", {
  dev: {
    autostart: true,
    command: "pnpm db:start",
  },
});
