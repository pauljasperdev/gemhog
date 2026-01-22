import { secrets } from "./secrets";

// Neon is an external database, not SST-managed
// Create a Linkable to expose connection URLs to linked resources
export const neon = new sst.Linkable("Neon", {
  properties: {
    // Direct connection URL (for migrations)
    url: secrets.DatabaseUrl.value,
    // Pooled connection URL (for Lambda runtime)
    urlPooler: secrets.DatabaseUrlPooler.value,
  },
});
