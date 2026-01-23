import { secrets } from "./secrets";

export const baseDomain = "gemhog.com";

export const domain = $dev
  ? "localhost:3001"
  : $app.stage === "prod"
    ? baseDomain
    : `${$app.stage}.${baseDomain}`;

export const domainApi = $dev
  ? "localhost:3000"
  : $app.stage === "prod"
    ? `api.${baseDomain}`
    : `api.${$app.stage}.${baseDomain}`;

export const router = new sst.aws.Router("ApiRouter", {
  domain: {
    name: domainApi,
    dns: sst.cloudflare.dns({
      zone: secrets.CloudflareZoneId.value,
    }),
  },
});
