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

new sst.x.DevCommand("Studio", {
  dev: {
    autostart: true,
    command: "pnpm db:studio",
  },
  environment: {
    DATABASE_URL: secrets.DatabaseUrl.value,
  },
});
