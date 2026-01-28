import { baseDomain } from "./router";
import { secrets } from "./secrets";

const emailDomain =
  $app.stage === "prod" ? baseDomain : `${$app.stage}.${baseDomain}`;

export const email = new sst.aws.Email("Email", {
  sender: emailDomain,
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
  dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;",
});
