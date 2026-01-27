import { secrets } from "./secrets";

export const email = new sst.aws.Email("Email", {
  sender: "gemhog.com",
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
  dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;",
});
