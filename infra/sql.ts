import { secrets } from "./secrets";

export const DATABASE_URL = $dev
  ? "postgresql://postgres:password@localhost:5432/gemhog"
  : secrets.DatabaseUrl.value;
export const DATABASE_URL_POOLER = $dev
  ? "postgresql://postgres:password@localhost:5432/gemhog"
  : secrets.DatabaseUrlPooler.value;

new sst.x.DevCommand("Database", {
  dev: {
    autostart: true,
    command: "pnpm db:start",
  },
});

new sst.x.DevCommand("Studio", {
  dev: {
    autostart: true,
    command: "pnpm sst:db:studio",
  },
  environment: {
    DATABASE_URL,
  },
});
