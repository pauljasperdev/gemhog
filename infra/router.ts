import { isPermanentStage } from "./utils";

export { isPermanentStage };

export const baseDomain = "gemhog.com";

export const domain =
  $app.stage === "prod"
    ? baseDomain
    : isPermanentStage
      ? `${$app.stage}.${baseDomain}`
      : `${$app.stage}.${baseDomain}`;

export const domainApi =
  $app.stage === "prod"
    ? `api.${baseDomain}`
    : isPermanentStage
      ? `api.${$app.stage}.${baseDomain}`
      : `${$app.stage}.api.${baseDomain}`;

export const router = isPermanentStage
  ? new sst.aws.Router("ApiRouter", {
      domain: {
        name: domainApi,
        dns: sst.cloudflare.dns({
          zone: process.env.CLOUDFLARE_ZONE_ID ?? "",
        }),
      },
    })
  : undefined;
