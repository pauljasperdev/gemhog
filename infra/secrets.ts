// SST secrets managed via `sst secret set <name> <value>`
// These map to environment variables in linked resources
export const secrets = {
  // Database
  DatabaseUrl: new sst.Secret("DatabaseUrl"),
  DatabaseUrlPooler: new sst.Secret("DatabaseUrlPooler"),

  // Auth
  BetterAuthSecret: new sst.Secret("BetterAuthSecret"),

  // AI
  GoogleApiKey: new sst.Secret("GoogleApiKey"),
};
