export const secrets = {
  DatabaseUrl: new sst.Secret("DatabaseUrl"),
  DatabaseUrlPooler: new sst.Secret("DatabaseUrlPooler"),
  BetterAuthSecret: new sst.Secret("BetterAuthSecret"),
  GoogleApiKey: new sst.Secret("GoogleApiKey"),
  CloudflareZoneId: new sst.Secret("CloudflareZoneId"),
  // Sentry error monitoring
  SentryDsn: new sst.Secret("SentryDsn"),
  SentryAuthToken: new sst.Secret("SentryAuthToken"),
  SentryOrg: new sst.Secret("SentryOrg"),
  SentryProject: new sst.Secret("SentryProject"),
};
