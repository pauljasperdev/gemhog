import { ConfigProvider, Layer } from "effect";

/**
 * Static literal map of integration test configuration values.
 * All values are fixed at module load time — no process.env reads.
 */
const testConfigMap = new Map<string, string>([
  ["DATABASE_URL", "postgresql://postgres:password@localhost:5433/gemhog_test"],
  [
    "DATABASE_URL_POOLER",
    "postgresql://postgres:password@localhost:5433/gemhog_test",
  ],
  ["BETTER_AUTH_SECRET", "ZpgIiuzmFRdZ6OSFTJQ1PHqgRLyhnzIe"],
  ["BETTER_AUTH_URL", "http://localhost:3000"],
  ["APP_URL", "http://localhost:3001"],
  ["GOOGLE_GENERATIVE_AI_API_KEY", "XXXXXXXXXXXXXXXXXXXXX"],
  ["RESEND_API_KEY", "re_test_placeholder"],
  [
    "SENTRY_DSN",
    "https://b0e726cbc64e580010757cb06aa83a72@o4510769605115904.ingest.de.sentry.io/4510769606295632",
  ],
  ["PODSCAN_API_TOKEN", "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"],
  ["PODSCAN_BASE_URL", "https://podscan.fm/api/v1"],
  ["ADMIN_EMAIL", "admin@gemhog.com"],
]);

/**
 * Integration test configuration layer.
 * Provides all config keys from the static literal map.
 * Missing keys will cause Effect failures when accessed.
 */
export const ConfigLayerTest = Layer.setConfigProvider(
  ConfigProvider.fromMap(testConfigMap),
);
