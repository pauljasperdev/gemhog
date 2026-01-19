---
phase: 01-testing-infrastructure
plan: 06
subsystem: testing
tags: [vitest, integration-tests, docker, testing-infrastructure]

dependency-graph:
  requires: [01-04]
  provides: [integration-test-convention, shared-docker-setup]
  affects: [all-packages]

tech-stack:
  added: []
  patterns: [file-suffix-convention, glob-based-discovery, shared-globalSetup]

key-files:
  created:
    - test/integration-setup.ts
    - vitest.integration.config.ts
    - packages/db/src/connection.integration.test.ts
  modified:
    - package.json
    - vitest.config.ts
    - packages/db/vitest.config.ts
    - .planning/codebase/TESTING.md
  deleted:
    - packages/db/test/global-setup.ts
    - packages/db/src/connection.test.ts

decisions:
  - id: integration-test-suffix
    choice: "Use *.integration.test.ts suffix for integration tests"
    reason: "Clear separation from unit tests, enables glob-based discovery"
  - id: shared-globalSetup
    choice: "Single test/integration-setup.ts for all packages"
    reason: "Consistent Docker handling, avoids duplication"
  - id: vitest4-sequential
    choice: "Use isolate: false and fileParallelism: false"
    reason: "Vitest 4 removed poolOptions, these are the new equivalents"

metrics:
  duration: 4 min
  completed: 2026-01-19
---

# Phase 01 Plan 06: Integration Test Convention Summary

**One-liner:** Scalable integration test infrastructure with *.integration.test.ts suffix convention and shared Docker auto-start

## What Changed

### New Infrastructure

1. **Shared Integration Setup** (`test/integration-setup.ts`)
   - Lives at repo root, used by all packages
   - Auto-starts Docker for PostgreSQL if not running
   - Detects external DATABASE_URL to skip Docker in CI
   - Uses `[integration]` log prefix for clarity

2. **Dedicated Integration Config** (`vitest.integration.config.ts`)
   - Discovers `*.integration.test.ts` across `apps/**/src/**` and `packages/**/src/**`
   - Points to shared `test/integration-setup.ts` as globalSetup
   - Runs tests sequentially (isolate: false, fileParallelism: false)
   - 60s hookTimeout for Docker startup, 10s testTimeout

3. **Test Naming Convention**
   - `*.test.ts` - Unit tests (mocked externals, fast)
   - `*.integration.test.ts` - Integration tests (real DB, Docker required)
   - `*.spec.ts` - E2E tests (Playwright)

### Changes to Existing Files

| File | Change |
|------|--------|
| `package.json` | test:integration now uses vitest.integration.config.ts |
| `vitest.config.ts` | Removed `!packages/db` exclusion, added `**/*.integration.test.ts` to exclude |
| `packages/db/vitest.config.ts` | Simplified to defineProject, added exclude for integration tests |
| `packages/db/test/global-setup.ts` | Deleted (replaced by root test/integration-setup.ts) |
| `packages/db/src/connection.test.ts` | Renamed to connection.integration.test.ts |

## Commands

```bash
# Run unit tests only (excludes *.integration.test.ts)
pnpm test:unit

# Run integration tests only (discovers *.integration.test.ts)
pnpm test:integration

# Add integration test to any package
# Just create src/something.integration.test.ts
```

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test file suffix | `*.integration.test.ts` | Clear separation, glob-discoverable |
| globalSetup location | `test/integration-setup.ts` at root | Single source of truth for Docker |
| Sequential execution | isolate: false, fileParallelism: false | Avoid DB conflicts, Vitest 4 format |
| Exclude in package configs | Add explicit exclude pattern | Root-level exclude doesn't propagate to projects |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Glob pattern includes integration tests**
- **Found during:** Verification
- **Issue:** `*.test.ts` matches `*.integration.test.ts` in Vitest glob
- **Fix:** Added explicit `exclude: ["**/*.integration.test.ts"]` in packages/db/vitest.config.ts
- **Commit:** d8043d5

**2. [Rule 1 - Bug] Vitest 4 deprecated poolOptions**
- **Found during:** Running test:integration
- **Issue:** `poolOptions.forks.singleFork` removed in Vitest 4
- **Fix:** Changed to `isolate: false` and `fileParallelism: false`
- **Commit:** d8043d5

## Verification Results

| Check | Result |
|-------|--------|
| `test/integration-setup.ts` exists | PASS |
| `vitest.integration.config.ts` exists | PASS |
| `packages/db/src/connection.integration.test.ts` exists | PASS |
| `packages/db/test/global-setup.ts` deleted | PASS |
| `pnpm test:unit` excludes integration tests | PASS (1 test) |
| `pnpm test:integration` discovers integration tests | PASS (file found) |
| Docker auto-start | ENV - needs Docker socket access |

**Note:** Docker permission denied is an environment limitation documented in CONCERNS.md (user not in docker group). The test infrastructure itself is correct.

## Commits

| Hash | Message |
|------|---------|
| 585275f | feat(01-06): create shared integration test setup |
| 049537e | feat(01-06): create dedicated integration test config |
| 07f6010 | chore(01-06): update test:integration script |
| 36ad63a | refactor(01-06): rename integration test to new convention |
| 6576b4a | refactor(01-06): exclude integration tests from unit test runs |
| 39dba42 | refactor(01-06): remove packages/db specific integration setup |
| 1b13a71 | docs(01-06): update TESTING.md with integration test convention |
| d8043d5 | fix(01-06): fix integration test exclusion and Vitest 4 config |

## Next Phase Readiness

**Ready for Phase 2** with notes:
- Integration tests can now be added to any package
- Docker socket access required for integration tests (documented)
- Pre-existing lint/type issues in codebase still need cleanup
