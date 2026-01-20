---
phase: 03-core-consolidation
plan: 01
subsystem: packages/core
tags: [effect, drizzle, database, layers]
dependency-graph:
  requires: [02-01]
  provides: [effect-database-layers, core-package-structure]
  affects: [03-02, 03-03]
tech-stack:
  added:
    - effect@^3.19
    - "@effect/sql@^0.49"
    - "@effect/sql-pg@^0.50"
    - "@effect/sql-drizzle@^0.48"
    - "@effect/vitest@^0.27"
  patterns: [effect-layers, tagged-errors, domain-driven-structure]
key-files:
  created:
    - packages/core/package.json
    - packages/core/tsconfig.json
    - packages/core/vitest.config.ts
    - packages/core/docker-compose.yml
    - packages/core/drizzle.config.ts
    - packages/core/.gitignore
    - packages/core/src/drizzle/index.ts
    - packages/core/src/drizzle/client.ts
    - packages/core/src/drizzle/errors.ts
  modified: []
decisions:
  - id: pkg-versions
    choice: "Use @effect/sql-pg ^0.50, @effect/sql-drizzle ^0.48, @effect/vitest ^0.27"
    rationale: "RESEARCH.md versions outdated; npm shows newer versions available"
  - id: sql-dep
    choice: "Add @effect/sql as explicit dependency"
    rationale: "TypeScript requires @effect/sql types to be resolvable for declaration files"
  - id: no-declaration
    choice: "Remove declaration/composite from tsconfig"
    rationale: "Not needed for workspace package with direct TS imports; avoids type resolution complexity"
metrics:
  duration: 3 min
  completed: 2026-01-20
---

# Phase 3 Plan 1: Core Package Foundation Summary

**One-liner:** Effect-based database layers (PgLive, DrizzleLive, DatabaseLive) in new packages/core with domain-driven structure

## What Was Done

### Task 1: Create packages/core package structure
Created the core package foundation with:
- `package.json` with Effect dependencies and subpath exports (`./drizzle`, `./auth`, `./payment`)
- `tsconfig.json` extending base config
- `vitest.config.ts` for unit tests
- `docker-compose.yml` copied from packages/db (PostgreSQL container)
- `drizzle.config.ts` with schema glob `./src/*/*.sql.ts`
- Directory structure: `src/drizzle/`, `src/auth/`, `src/payment/`

### Task 2: Create Effect database layers
Implemented Effect-based database infrastructure:
- `src/drizzle/errors.ts` - Tagged errors (DatabaseError, ConnectionError)
- `src/drizzle/client.ts` - PgLive layer using `PgClient.layerConfig` with `Config.redacted("DATABASE_URL")`
- `src/drizzle/index.ts` - DrizzleLive composed on PgLive, DatabaseLive combining both

### Task 3: Install dependencies and verify
- Resolved version mismatches (RESEARCH.md had outdated versions)
- Added @effect/sql as explicit dependency for type resolution
- Simplified tsconfig (removed declaration/composite)
- Verified TypeScript compilation passes

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 7d4de91 | feat(03-01): create packages/core package structure | package.json, tsconfig, vitest.config.ts, docker-compose.yml, drizzle.config.ts, .gitignore |
| 37c8d7d | feat(03-01): create Effect database layers | src/drizzle/index.ts, client.ts, errors.ts |
| aea4232 | chore(03-01): install Effect dependencies and fix config | package.json, tsconfig.json, pnpm-lock.yaml |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated Effect package versions**
- **Found during:** Task 3
- **Issue:** RESEARCH.md specified @effect/vitest@^0.45 but latest is 0.27.0; @effect/sql-* versions also outdated
- **Fix:** Updated to @effect/sql-pg@^0.50, @effect/sql-drizzle@^0.48, @effect/vitest@^0.27
- **Files modified:** packages/core/package.json

**2. [Rule 3 - Blocking] Added @effect/sql dependency**
- **Found during:** Task 3
- **Issue:** TypeScript error TS2742 "inferred type cannot be named without reference to @effect/sql"
- **Fix:** Added @effect/sql@^0.49 as explicit dependency
- **Files modified:** packages/core/package.json

**3. [Rule 1 - Bug] Simplified tsconfig**
- **Found during:** Task 3
- **Issue:** declaration: true caused type portability errors with Effect layers
- **Fix:** Removed declaration/declarationMap/composite (not needed for workspace package)
- **Files modified:** packages/core/tsconfig.json

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use newer Effect package versions | RESEARCH.md versions outdated; npm shows 0.50/0.48/0.27 as latest |
| Add @effect/sql as explicit dependency | Required for TypeScript type resolution |
| Remove declaration/composite from tsconfig | Workspace packages use direct TS imports; declaration files not needed |

## Verification Results

- [x] packages/core directory exists with package.json, tsconfig.json, drizzle.config.ts
- [x] src/drizzle/ directory contains index.ts, client.ts, errors.ts
- [x] pnpm install succeeds without errors
- [x] Type checking passes for packages/core

## Next Phase Readiness

### Blockers
None.

### Ready For
- Plan 02: Auth domain migration - can import DatabaseLive layer
- `@gemhog/core/drizzle` export ready for auth domain to compose with

### Known Issues
- @effect/vitest peer dependency warning (expects vitest ^3.2, have 4.0.17) - non-blocking
- @polar-sh/sdk peer dependency mismatch - pre-existing, unrelated to this plan
