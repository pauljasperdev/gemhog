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
    // Sentry error monitoring
    NEXT_PUBLIC_SENTRY_DSN: secrets.SentryDsn.value,
    SENTRY_DSN: secrets.SentryDsn.value,
    SENTRY_AUTH_TOKEN: secrets.SentryAuthToken.value,
    SENTRY_ORG: secrets.SentryOrg.value,
    SENTRY_PROJECT: secrets.SentryProject.value,
  },
});

export const outputs = {
  webUrl: web.url,
};
