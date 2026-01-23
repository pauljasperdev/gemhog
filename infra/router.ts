import { secrets } from "./secrets";

export const baseDomain = "gemhog.com";

export const domain =
  $app.stage === "prod" ? baseDomain : `${$app.stage}.${baseDomain}`;

export const domainApi =
  $app.stage === "prod"
    ? `api.${baseDomain}`
    : `api.${$app.stage}.${baseDomain}`;

const routerDomain = {
  name: domainApi,
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
};

export const router = new sst.aws.Router("ApiRouter", {
  domain: routerDomain,
});
