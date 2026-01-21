# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Make the repo restructure-ready, testable, security-checkable, and deployable
**Current focus:** Phase 3.2 - Code Quality & TDD Practices

## Current Position

Phase: 3.2 of 7 (Code Quality & TDD Practices) - IN PROGRESS
Plan: 3/5 plans complete (03.2-01, 03.2-02, 03.2-03)
Status: Executing wave 1
Last activity: 2026-01-21 - Completed 03.2-03 (E2E error detection fixture)

Progress: █████████████ ~82% (Phase 1 + 1.1 + 2 + 3 + 3.1 + 3.2 partial complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 23
- Average duration: 4.2 min
- Total execution time: 96 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Testing Infrastructure | 7/7 | 21 min | 3.0 min |
| 1.1. Test File Convention | 1/1 | 2 min | 2.0 min |
| 2. Security Workflow | 1/1 | 3 min | 3.0 min |
| 3. Core Consolidation | 5/5 | 15 min | 3.0 min |
| 3.1. Code Review Fixes | 9/9 | 55 min | 6.1 min |

**Recent Trend:**
- Last 5 plans: 03.1-06 (6 min), 03.1-07 (2 min), 03.1-08 (4 min), 03.1-09 (3 min)
- Note: 03.1-03 and 03.1-04 took longer due to parallel agent coordination

## Accumulated Context

### Roadmap Evolution

- Phase 1.1 inserted after Phase 1: Test file convention migration (URGENT) - standardize to *.test.ts, *.int.test.ts, *.e2e.test.ts
- Phase 3.1 inserted after Phase 3: Code review fixes (URGENT) - address CODE_REVIEW.md findings before deployment
- Phase 3.2 inserted after Phase 3.1: Code quality & TDD practices (URGENT) - dead code cleanup, test coverage gaps, TDD guidance in TESTING.md

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Rationale | Plan |
|----------|-----------|------|
| Use Vitest projects array (not workspace) | Modern approach for Vitest 3.2+ | 01-01 |
| Exclude packages/db from root config | Has Docker globalSetup, runs separately | 01-01 |
| Use --error-on-warnings for Biome | CI-safe exit codes | 01-01 |
| Don't auto-stop Docker containers in teardown | Developers may want them running for db:studio | 01-02 |
| Use pg_isready for PostgreSQL health check | More reliable than container start status | 01-02 |
| Detect external DB via DATABASE_URL hostname | Enables Test-stage AWS without code changes | 01-02 |
| webServer reuseExistingServer: !process.env.CI | Fresh servers in CI, reuse locally | 01-03 |
| Chromium-only for E2E | Faster, sufficient coverage | 01-03 |
| Pre-commit runs biome on staged files + typecheck | Fast checks on commit | 01-03 |
| Use --config flag for integration tests | --project can't find excluded packages | 01-04 |
| defineConfig over defineProject for standalone | Standalone configs need full config object | 01-04 |
| Explicit root path in Vitest config | Paths resolve from monorepo root otherwise | 01-04 |
| Spread process.env first in webServer env | Real env vars override test defaults | 01-04 |
| Use *.int.test.ts suffix convention | Shorter, clear separation from unit tests, glob-discoverable | 01.1-01 |
| Use *.e2e.test.ts for E2E tests | Consistent with other test suffixes, explicit test type | 01.1-01 |
| Use git mv for test file renames | Preserves git history | 01.1-01 |
| Single test/integration-setup.ts for all packages | Consistent Docker handling, avoids duplication | 01-06 |
| Use isolate: false, fileParallelism: false | Vitest 4 removed poolOptions, these are equivalents | 01-06 |
| Use biome-ignore for intentional effect triggers | Scroll-on-message-count is intentional, not a bug | 01-07 |
| Composite keys for nested map iterations | ${message.id}-${index} avoids noArrayIndexKey warning | 01-07 |
| Underscore prefix for unused props | session: _session indicates intentionally unused | 01-07 |
| Add hono as regular dependency in packages/api | Consistency with apps/server, even for type-only imports | 01-08 |
| Security review runs on every commit | Security issues hide in unexpected places | 02-01 |
| Medium severity blocks completion | Prevents accumulation of Medium issues | 02-01 |
| SECURITY-REVIEW.md is append-only log | Maintains full audit trail | 02-01 |
| CONCERNS.md references SECURITY-REVIEW.md | Single source of truth, no duplication | 02-01 |
| pnpm audit --audit-level moderate in verify.sh | Matches workflow severity (moderate = blocks) | 02-01 |
| Use @effect/sql-pg ^0.50, @effect/sql-drizzle ^0.48 | RESEARCH.md versions outdated; updated to npm latest | 03-01 |
| Add @effect/sql as explicit dependency | Required for TypeScript type resolution | 03-01 |
| Remove declaration/composite from tsconfig | Workspace packages use direct TS imports | 03-01 |
| Use require() for deferred env validation | Allows unit tests without env vars | 03-02, 03-03 |
| Use Proxy for backward-compatible exports | Seamless migration for existing code | 03-02, 03-03 |
| Lazy getter pattern for auth/payment instances | Caches instance on first access | 03-02, 03-03 |
| Delete old packages completely after migration | All code migrated to @gemhog/core | 03-05 |
| Remove unused dependencies discovered during verification | @gemhog/auth was in apps/web but unused | 03-05 |
| Delete entire payment/ directory | All exports unused, no reason to keep empty module | 03.1-02 |
| Keep @polar-sh/sdk despite payment deletion | auth.service.ts uses it inline for better-auth plugin | 03.1-02 |
| Rename drizzle-kit generated migrations | 0000_initial_schema.sql more descriptive than random name | 03.1-01 |
| Format migration JSON with Biome | Pre-commit hooks require Biome formatting | 03.1-01 |
| Add NEXT_PUBLIC_SERVER_URL to E2E web server env | Next.js env validation requires it for E2E tests | 03.1-01 |
| Deferred require() for auth.service.ts | Static env import breaks unit tests without env vars | 03.1-03 |
| dotenv directly in drizzle.config.ts | drizzle-kit only needs DATABASE_URL, not all env vars | 03.1-03 |
| Remove Effect wrapper from auth | better-auth is self-contained at HTTP boundary | 03.1-04 |
| Delete auth.mock.ts | Only provided Effect Layer mocks, no longer needed | 03.1-04 |
| Keep dotenv in packages/core | drizzle.config.ts needs dotenv directly (per 03.1-03 decision) | 03.1-05 (superseded by 03.1-06) |
| Remove @effect/vitest from packages/core | Unused after auth simplification in 03.1-04 | 03.1-05 |
| Use knip for dependency audits | Identifies truly unused dependencies vs false positives | 03.1-05 |
| Inline rate limiting for AI endpoint | Simpler than external package for single-server | 03.1-08 |
| UIMessage parts validation schema | AI SDK v6 uses parts array, not simple content string | 03.1-08 |
| Discriminated union for message parts | TextPartSchema, FilePartSchema, OtherPartSchema with passthrough | 03.1-08 |
| drizzle.config.ts uses @gemhog/env/server | Centralize env handling, remove dotenv from packages/core | 03.1-06 |
| Static import for env in auth.service.ts | Module loads validate env at import time, tests mock via vi.mock() | 03.1-07 |
| vi.mock() pattern for unit test env isolation | Mock env module before importing dependent modules | 03.1-07 |
| All security findings resolved | SEC-001/002/003 fixed, SEC-004/005 closed (Polar removed) | 03.1-09 |
| E2E tests use extended Playwright fixture for error detection | Captures console.error and page exceptions | 03.2-03 |
| TDD: Tests fail when app has errors - fix app, not test | Tests correctly detected NEXT_PUBLIC_SERVER_URL issue | 03.2-03 |
| Recreate Config definition in tests for isolation | Avoids triggering env validation at import time | 03.2-02 |
| ConfigProvider.fromMap for isolated env testing | Precise control over env vars without touching process.env | 03.2-02 |

### Pending Todos

None.

### Blockers/Concerns

- Pre-existing lint issues remain in mode-toggle.tsx, label.tsx, .agent/prd.json (not in scope of 01-07)
- Docker socket access needed for integration tests (environment-specific)
- Playwright browser dependencies needed for E2E tests (environment-specific)

**Security Status (resolved in 03.1-09):**
- All 5 security findings resolved
- SEC-001 (Input validation) FIXED in 03.1-08
- SEC-002 (Rate limiting) FIXED in 03.1-08
- SEC-003 (Debug logging) FIXED in 03.1-07
- SEC-004 (Polar productId) CLOSED in 03.1-07
- SEC-005 (Polar sandbox) CLOSED in 03.1-07
- pnpm audit: No known vulnerabilities

## Phase 1 Summary

Testing infrastructure complete - type check passes, targeted lint fixed:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 01-01 | Vitest + Biome static analysis | 4 min | Complete |
| 01-02 | Docker auto-start for integration tests | 2 min | Complete |
| 01-03 | Playwright E2E + Lefthook hooks + verify.sh | 3 min | Complete |
| 01-04 | Fix test bugs from UAT | 5 min | Complete |
| 01-06 | Integration test convention (*.integration.test.ts) | 4 min | Complete |
| 01-07 | Fix pre-existing lint issues (ai/page, dashboard) | 2 min | Complete |
| 01-08 | Add missing hono dependency | <1 min | Complete |

**Script Status (all working):**
- `pnpm test:unit` - Passes, excludes *.int.test.ts
- `pnpm test:integration` - Uses vitest.integration.config.ts, discovers all packages
- `pnpm test:e2e` - webServer starts with test env vars
- `pnpm check-types` - PASSES (fixed in 01-08)

**Test File Convention:**
- `*.test.ts` - Unit tests (mocked, fast)
- `*.int.test.ts` - Integration tests (real DB, Docker)
- `*.e2e.test.ts` - E2E tests (Playwright)

**Remaining Issues (pre-existing, outside gap closure scope):**
1. Lint issues in mode-toggle.tsx (unused import)
2. Lint issues in label.tsx (a11y warning)
3. Empty .agent/prd.json file (parse error)
4. Formatting issues in playwright.config.ts, vitest.config.ts

**Key Commands:**
- `pnpm check` - Static analysis with Biome (fails: pre-existing lint issues outside plan scope)
- `pnpm check-types` - Type checking (PASSES)
- `pnpm test:unit` - Unit tests (PASSES)
- `pnpm test:integration` - Integration tests (works, needs Docker)
- `pnpm test:e2e` - E2E tests (works, needs Playwright deps)
- `pnpm verify:commit` - Pre-commit check (fails: pre-existing lint issues)
- `pnpm verify` - Full verification pipeline (fails: pre-existing lint issues)

## Phase 1.1 Summary

Test file convention migration complete:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 01.1-01 | Rename files and update configs | 2 min | Complete |

**Convention Standardized:**
- `*.test.ts` - Unit tests (unchanged)
- `*.int.test.ts` - Integration tests (was *.integration.test.ts)
- `*.e2e.test.ts` - E2E tests (was *.spec.ts)

## Phase 2 Summary

Security workflow complete:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 02-01 | Security verification workflow + pnpm audit | 3 min | Complete |

**Security Workflow Established:**
- CLAUDE.md: Security Verification (MANDATORY) section with 7-step workflow
- SECURITY-REVIEW.md: Cumulative findings log (append-only)
- CONCERNS.md: References SECURITY-REVIEW.md (no duplication)
- verify.sh: Dependency Security step with pnpm audit
- Severity blocking: Critical/High/Medium block, Low does not

**New Commands:**
- `pnpm security:audit` - Run dependency audit standalone

## Phase 3 Summary

Core consolidation complete - packages/core with Effect TS:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 03-01 | Core package foundation with Effect layers | 3 min | Complete |
| 03-02 | Auth domain migration | 2 min | Complete |
| 03-03 | Payment domain migration | 4 min | Complete |
| 03-04 | Consumer migration to @gemhog/core | 2 min | Complete |
| 03-05 | Old package removal | 4 min | Complete |

**packages/core created:**
- Effect database layers: PgLive, DrizzleLive, DatabaseLive
- Auth domain: simplified (no Effect wrapper after 03.1-04)
- Subpath exports: ./drizzle, ./auth, ./auth/auth.sql
- Integration test: connection.int.test.ts
- Note: Payment module removed in 03.1-02 (dead code)

**Old packages removed:**
- packages/db deleted (16 files)
- packages/auth deleted (6 files)
- Root db:* scripts updated to @gemhog/core
- Unused @gemhog/auth dependency removed from apps/web

**Key Patterns Established:**
- Effect Context.Tag for service interfaces
- Effect Layer for dependency injection
- Deferred env validation via require() for testability
- Mock layers (*ServiceTest) for unit testing

## Phase 3.1 Summary

Code review fixes complete:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 03.1-01 | Generate database migrations | 3 min | Complete |
| 03.1-02 | Remove dead payment service code | 3 min | Complete |
| 03.1-03 | Replace t3-env with Effect Config | 15 min | Complete |
| 03.1-04 | Simplify auth by removing Effect wrapper | 15 min | Complete |
| 03.1-05 | Audit and remove unused dependencies | 4 min | Complete |
| 03.1-06 | Fix drizzle.config.ts to use @gemhog/env/server | 6 min | Complete |
| 03.1-07 | Auth cleanup (static imports, Polar removal) | 2 min | Complete |
| 03.1-08 | AI endpoint security (validation + rate limiting) | 7 min | Complete |
| 03.1-09 | Security review and verification | 3 min | Complete |

**Completed:**
- Generated initial database migrations (user, session, account, verification tables)
- Applied migrations to local PostgreSQL, verified with integration tests
- Deleted packages/core/src/payment/ directory (5 files)
- Removed ./payment subpath export from package.json
- Replaced t3-env with Effect Config in packages/env
- Sensitive values use Config.redacted() and Redacted.value()
- Simplified auth.service.ts (removed Context.Tag, Layer)
- Deleted auth.mock.ts (Effect Layer mocks no longer needed)
- Updated auth exports: getAuth, auth, getSession
- Removed 9 unused dependencies identified by knip audit
- Centralized dotenv to packages/env (and packages/core for drizzle.config.ts)
- Added Zod validation for AI endpoint (SEC-001)
- Added rate limiting to AI endpoint (SEC-002)
- Fixed auth.service.ts to defer env import for testability
- drizzle.config.ts now uses @gemhog/env/server with Redacted.value()
- Removed dotenv dependency from packages/core
- auth.service.ts uses static env import (no more require() hack)
- All @polar-sh packages removed from codebase
- Unit tests mock env module via vi.mock() pattern
- Security review completed, all 5 findings resolved
- Full verification pipeline passes (static, unit, integration, e2e, security audit)

## Phase 3.2 Summary (in progress)

Code quality and TDD practices:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 03.2-01 | Remove dead code and archaeological comments | - | Complete |
| 03.2-02 | Add unit tests for env validation | 3 min | Complete |
| 03.2-03 | E2E error detection fixture | 3 min | Complete |
| 03.2-04 | Integration tests for auth | - | Pending |
| 03.2-05 | TDD guidance in TESTING.md | - | Pending |

**E2E Test Pattern:**
- All E2E tests import from `./fixtures`, not `@playwright/test`
- Fixture captures console.error and page exceptions
- Tests fail when app has runtime errors (TDD behavior)

## Session Continuity

Last session: 2026-01-21T19:23:51Z
Stopped at: Completed 03.2-02-PLAN.md (env schema validation tests)
Resume file: None

Next: Continue with 03.2-04 (auth integration tests) or 03.2-05 (TDD guidance).
