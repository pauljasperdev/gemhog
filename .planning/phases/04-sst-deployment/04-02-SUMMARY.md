---
phase: 04-sst-deployment
plan: 02
subsystem: infrastructure
tags: [sst, aws, secrets, neon, database]
dependency-graph:
  requires: [04-01]
  provides: [sst-config, secrets-management, neon-linkable]
  affects: [04-03, 04-04, 04-05]
tech-stack:
  added: []
  patterns: [dynamic-imports, linkable-pattern, secrets-as-code]
key-files:
  created:
    - sst.config.ts
    - infra/secrets.ts
    - infra/neon.ts
  modified: []
decisions:
  - id: region-selection
    choice: eu-central-1
    reason: Frankfurt region per CONTEXT.md
  - id: secrets-organization
    choice: Single secrets.ts file with categorized secrets
    reason: Follows SST monorepo pattern, easy to maintain
  - id: neon-dual-url
    choice: Expose both direct and pooled URLs via Linkable
    reason: Pooled for Lambda runtime, direct for migrations (DDL incompatible with pooler)
metrics:
  duration: 4 min
  completed: 2026-01-22
---

# Phase 4 Plan 02: SST Configuration and Secrets Summary

SST project structure with secrets management and Neon database Linkable using
dynamic imports pattern

## What Was Built

### Task 1: SST App Configuration

Created `sst.config.ts` at repo root with:
- App name: `gemhog`
- Region: `eu-central-1` (Frankfurt)
- Providers: AWS (home) + Cloudflare (DNS)
- Removal policy: retain for prod, remove for other stages
- Protection: enabled for prod stage
- Dynamic imports for infra modules (secrets, neon, api, web)

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "gemhog",
      removal: input.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input.stage),
      home: "aws",
      providers: {
        aws: { region: "eu-central-1" },
        cloudflare: true,
      },
    };
  },
  async run() {
    // Dynamic imports for side effects
    const _secrets = await import("./infra/secrets");
    const _neon = await import("./infra/neon");
    const api = await import("./infra/api");
    const web = await import("./infra/web");

    return {
      ...(api.outputs || {}),
      ...(web.outputs || {}),
    };
  },
});
```

### Task 2: SST Secrets Configuration

Created `infra/secrets.ts` with all required secrets:
- `DatabaseUrl` - Direct Neon connection (for migrations)
- `DatabaseUrlPooler` - Pooled Neon connection (for Lambda runtime)
- `BetterAuthSecret` - Auth session encryption key
- `GoogleApiKey` - Google Generative AI API key

Note: Secrets are set via `sst secret set <name> <value>` per stage.

### Task 3: Neon Database Linkable

Created `infra/neon.ts` with custom Linkable pattern:
- Exposes `url` (direct) and `urlPooler` (pooled) properties
- Direct URL for migrations (DDL operations incompatible with transaction pooling)
- Pooled URL for Lambda runtime (connection reuse in serverless)

```typescript
import { secrets } from "./secrets";

export const neon = new sst.Linkable("Neon", {
  properties: {
    url: secrets.DatabaseUrl.value,
    urlPooler: secrets.DatabaseUrlPooler.value,
  },
});
```

## Key Patterns Established

1. **Dynamic Imports**: Infra modules imported in `run()` function, not at top level
2. **One File Per Resource**: `secrets.ts`, `neon.ts`, future `api.ts`, `web.ts`
3. **Linkable for External Resources**: Neon is external, wrapped in Linkable
4. **Side-Effect Imports**: Underscore prefix for modules imported only for registration

## Commits

| Hash    | Description                                      | Files                 |
| ------- | ------------------------------------------------ | --------------------- |
| 53c2784 | feat(04-02): create SST app configuration        | sst.config.ts         |
| bfc53b4 | feat(04-02): create Neon database Linkable       | infra/neon.ts         |
| b99d524 | fix(04-02): prefix unused imports for lint       | sst.config.ts         |

Note: `infra/secrets.ts` was committed by parallel agent in 790f0af (04-03 plan).

## Deviations from Plan

### Parallel Execution Overlap

Task 2 (infra/secrets.ts) was already completed by a parallel agent executing
plan 04-03. The file was committed with identical content to the plan
specification. No action needed - content verified correct.

### Auto-fixed Issues

**1. [Rule 1 - Bug] Lint warnings for unused variables**

- **Found during:** Task 1 commit
- **Issue:** Biome flagged `secrets` and `neon` imports as unused
- **Fix:** Renamed to `_secrets` and `_neon` (underscore prefix convention)
- **Files modified:** sst.config.ts
- **Commit:** b99d524

## Verification Results

All success criteria met:
- [x] sst.config.ts exists at repo root with gemhog app config
- [x] infra/secrets.ts defines all four required secrets
- [x] infra/neon.ts creates Linkable with url and urlPooler properties
- [x] Code follows patterns from RESEARCH.md

## Next Steps

Plan 04-03 (Hono Lambda Entrypoint) and 04-04 (API Infrastructure) can proceed.
These will use:
- `secrets` for BetterAuthSecret and GoogleApiKey
- `neon` for database connection linking

---

_Phase: 04-sst-deployment Plan: 02 Duration: 4 min Completed: 2026-01-22_
