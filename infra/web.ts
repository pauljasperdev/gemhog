import { domain, domainApi } from "./router";
import { secrets } from "./secrets";

const webDomain = {
  name: domain,
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
};

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/web",
  domain: webDomain,
  environment: {
    NEXT_PUBLIC_SERVER_URL: `https://${domainApi}`,
  },
});

export const outputs = {
  webUrl: web.url,
};
