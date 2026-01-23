import { domain, domainApi } from "./router";
import { secrets } from "./secrets";

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/web",
  domain: {
    name: domain,
    dns: sst.cloudflare.dns({
      zone: secrets.CloudflareZoneId.value,
    }),
  },
  environment: {
    NEXT_PUBLIC_SERVER_URL: `https://${domainApi}`,
    DATABASE_URL: secrets.DatabaseUrl.value,
    DATABASE_URL_POOLER: secrets.DatabaseUrlPooler.value,
    BETTER_AUTH_SECRET: secrets.BetterAuthSecret.value,
    BETTER_AUTH_URL: `https://${domainApi}`,
    CORS_ORIGIN: `https://${domain}`,
  },
});

export const outputs = {
  webUrl: web.url,
};
