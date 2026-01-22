import { api } from "./api";
import { domain, domainApi, isPermanentStage } from "./router";
import { secrets } from "./secrets";

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/web",
  ...(isPermanentStage
    ? {
        domain: {
          name: domain,
          dns: sst.cloudflare.dns({
            zone: process.env.CLOUDFLARE_ZONE_ID ?? "",
          }),
        },
      }
    : {}),
  environment: {
    NEXT_PUBLIC_SERVER_URL: isPermanentStage ? `https://${domainApi}` : api.url,
    DATABASE_URL: secrets.DatabaseUrl.value,
    DATABASE_URL_POOLER: secrets.DatabaseUrlPooler.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: isPermanentStage ? `https://${domainApi}` : api.url,
    CORS_ORIGIN: `https://${domain}`,
  },
});

export const outputs = {
  webUrl: web.url,
};
