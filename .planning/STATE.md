# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Make the repo restructure-ready, testable, security-checkable,
and deployable **Current focus:** Phase 3.4 complete, ready for Phase 4

## Current Position

Phase: 4 of 8 (SST Deployment) - IN PROGRESS
Plan: 3/5 plans complete
Status: Plan 04-03 complete
Last activity: 2026-01-22 - Completed 04-03-PLAN.md (Lambda handler with streaming)

Progress: ██████████████████░░ ~93% (Phase 1 + 1.1 + 2 + 3 + 3.1 + 3.2 + 3.3 + 3.4 complete, Phase 4 in progress)

## Performance Metrics

**Velocity:**

- Total plans completed: 41
- Average duration: 4.5 min
- Total execution time: 193 min

**By Phase:**

| Phase                         | Plans | Total  | Avg/Plan |
| ----------------------------- | ----- | ------ | -------- |
| 1. Testing Infrastructure     | 7/7   | 21 min | 3.0 min  |
| 1.1. Test File Convention     | 1/1   | 2 min  | 2.0 min  |
| 2. Security Workflow          | 1/1   | 3 min  | 3.0 min  |
| 3. Core Consolidation         | 5/5   | 15 min | 3.0 min  |
| 3.1. Code Review Fixes        | 9/9   | 55 min | 6.1 min  |
| 3.2. Code Quality & TDD       | 6/6   | 25 min | 4.2 min  |
| 3.3. Unify Env Validation     | 2/2   | 8 min  | 4.0 min  |
| 3.4. Integration Test Coverage| 7/7   | 46 min | 6.6 min  |
| 4. SST Deployment             | 3/5   | 20 min | 6.7 min  |

**Recent Trend:**

- Last 5 plans: 03.4-06 (5 min), 03.4-07 (10 min), 04-01 (10 min), 04-02 (4 min), 04-03 (6 min)

## Accumulated Context

### Roadmap Evolution

- Phase 1.1 inserted after Phase 1: Test file convention migration (URGENT) -
  standardize to _.test.ts, _.int.test.ts, \*.e2e.test.ts
- Phase 3.1 inserted after Phase 3: Code review fixes (URGENT) - address
  CODE_REVIEW.md findings before deployment
- Phase 3.2 inserted after Phase 3.1: Code quality & TDD practices (URGENT) -
  dead code cleanup, test coverage gaps, TDD guidance in TESTING.md
- Phase 3.3 inserted after Phase 3.2: Unify env validation with t3-env (URGENT) -
  replace mixed Effect Config/plain function with unified t3-env package
- Phase 3.4 inserted after Phase 3.3: Integration test coverage (URGENT) -
  fix db:migrate env loading, test Effect constructs, auth flows, migrations

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Recent decisions
affecting current work:

| Decision                                                      | Rationale                                                          | Plan                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------- |
| Use Vitest projects array (not workspace)                     | Modern approach for Vitest 3.2+                                    | 01-01                           |
| Exclude packages/db from root config                          | Has Docker globalSetup, runs separately                            | 01-01                           |
| Use --error-on-warnings for Biome                             | CI-safe exit codes                                                 | 01-01                           |
| Don't auto-stop Docker containers in teardown                 | Developers may want them running for db:studio                     | 01-02                           |
| Use pg_isready for PostgreSQL health check                    | More reliable than container start status                          | 01-02                           |
| Detect external DB via DATABASE_URL hostname                  | Enables Test-stage AWS without code changes                        | 01-02                           |
| webServer reuseExistingServer: !process.env.CI                | Fresh servers in CI, reuse locally                                 | 01-03                           |
| Chromium-only for E2E                                         | Faster, sufficient coverage                                        | 01-03                           |
| Pre-commit runs biome on staged files + typecheck             | Fast checks on commit                                              | 01-03                           |
| Use --config flag for integration tests                       | --project can't find excluded packages                             | 01-04                           |
| defineConfig over defineProject for standalone                | Standalone configs need full config object                         | 01-04                           |
| Explicit root path in Vitest config                           | Paths resolve from monorepo root otherwise                         | 01-04                           |
| Spread process.env first in webServer env                     | Real env vars override test defaults                               | 01-04                           |
| Use \*.int.test.ts suffix convention                          | Shorter, clear separation from unit tests, glob-discoverable       | 01.1-01                         |
| Use \*.e2e.test.ts for E2E tests                              | Consistent with other test suffixes, explicit test type            | 01.1-01                         |
| Use git mv for test file renames                              | Preserves git history                                              | 01.1-01                         |
| Single test/integration-setup.ts for all packages             | Consistent Docker handling, avoids duplication                     | 01-06                           |
| Use isolate: false, fileParallelism: false                    | Vitest 4 removed poolOptions, these are equivalents                | 01-06                           |
| Use biome-ignore for intentional effect triggers              | Scroll-on-message-count is intentional, not a bug                  | 01-07                           |
| Composite keys for nested map iterations                      | ${message.id}-${index} avoids noArrayIndexKey warning              | 01-07                           |
| Underscore prefix for unused props                            | session: \_session indicates intentionally unused                  | 01-07                           |
| Add hono as regular dependency in packages/api                | Consistency with apps/server, even for type-only imports           | 01-08                           |
| Security review runs on every commit                          | Security issues hide in unexpected places                          | 02-01                           |
| Medium severity blocks completion                             | Prevents accumulation of Medium issues                             | 02-01                           |
| SECURITY-REVIEW.md is append-only log                         | Maintains full audit trail                                         | 02-01                           |
| CONCERNS.md references SECURITY-REVIEW.md                     | Single source of truth, no duplication                             | 02-01                           |
| pnpm audit --audit-level moderate in verify.sh                | Matches workflow severity (moderate = blocks)                      | 02-01                           |
| Use @effect/sql-pg ^0.50, @effect/sql-drizzle ^0.48           | RESEARCH.md versions outdated; updated to npm latest               | 03-01                           |
| Add @effect/sql as explicit dependency                        | Required for TypeScript type resolution                            | 03-01                           |
| Remove declaration/composite from tsconfig                    | Workspace packages use direct TS imports                           | 03-01                           |
| Use require() for deferred env validation                     | Allows unit tests without env vars                                 | 03-02, 03-03                    |
| Use Proxy for backward-compatible exports                     | Seamless migration for existing code                               | 03-02, 03-03                    |
| Lazy getter pattern for auth/payment instances                | Caches instance on first access                                    | 03-02, 03-03                    |
| Delete old packages completely after migration                | All code migrated to @gemhog/core                                  | 03-05                           |
| Remove unused dependencies discovered during verification     | @gemhog/auth was in apps/web but unused                            | 03-05                           |
| Delete entire payment/ directory                              | All exports unused, no reason to keep empty module                 | 03.1-02                         |
| Keep @polar-sh/sdk despite payment deletion                   | auth.service.ts uses it inline for better-auth plugin              | 03.1-02                         |
| Rename drizzle-kit generated migrations                       | 0000_initial_schema.sql more descriptive than random name          | 03.1-01                         |
| Format migration JSON with Biome                              | Pre-commit hooks require Biome formatting                          | 03.1-01                         |
| Add NEXT_PUBLIC_SERVER_URL to E2E web server env              | Next.js env validation requires it for E2E tests                   | 03.1-01                         |
| Deferred require() for auth.service.ts                        | Static env import breaks unit tests without env vars               | 03.1-03                         |
| dotenv directly in drizzle.config.ts                          | drizzle-kit only needs DATABASE_URL, not all env vars              | 03.1-03                         |
| Remove Effect wrapper from auth                               | better-auth is self-contained at HTTP boundary                     | 03.1-04                         |
| Delete auth.mock.ts                                           | Only provided Effect Layer mocks, no longer needed                 | 03.1-04                         |
| Keep dotenv in packages/core                                  | drizzle.config.ts needs dotenv directly (per 03.1-03 decision)     | 03.1-05 (superseded by 03.1-06) |
| Remove @effect/vitest from packages/core                      | Unused after auth simplification in 03.1-04                        | 03.1-05                         |
| Use knip for dependency audits                                | Identifies truly unused dependencies vs false positives            | 03.1-05                         |
| Inline rate limiting for AI endpoint                          | Simpler than external package for single-server                    | 03.1-08                         |
| UIMessage parts validation schema                             | AI SDK v6 uses parts array, not simple content string              | 03.1-08                         |
| Discriminated union for message parts                         | TextPartSchema, FilePartSchema, OtherPartSchema with passthrough   | 03.1-08                         |
| drizzle.config.ts uses @gemhog/env/server                     | Centralize env handling, remove dotenv from packages/core          | 03.1-06                         |
| Static import for env in auth.service.ts                      | Module loads validate env at import time, tests mock via vi.mock() | 03.1-07                         |
| vi.mock() pattern for unit test env isolation                 | Mock env module before importing dependent modules                 | 03.1-07                         |
| All security findings resolved                                | SEC-001/002/003 fixed, SEC-004/005 closed (Polar removed)          | 03.1-09                         |
| E2E tests use extended Playwright fixture for error detection | Captures console.error and page exceptions                         | 03.2-03                         |
| Plain function for web.ts (not Effect Config)                 | Effect Config fails in browser; Next.js needs direct process.env   | 03.2-06                         |
| Recreate Config definition in tests for isolation             | Avoids triggering env validation at import time                    | 03.2-02                         |
| ConfigProvider.fromMap for isolated env testing               | Precise control over env vars without touching process.env         | 03.2-02                         |
| TDD section in TESTING.md before "What to Mock"               | Logical reading flow for test documentation                        | 03.2-04                         |
| Expanded Comments section with concrete examples              | Actionable guidance better than principles-only                    | 03.2-04                         |
| Use tsx from local node_modules/.bin for startup tests        | Spawned process needs PATH but tsx isn't globally available        | 03.2-05                         |
| Temp directory with symlinks for web startup tests            | Next.js auto-reads .env; symlink all except .env to test missing   | 03.2-05                         |
| DOTENV_CONFIG_PATH=/nonexistent for server startup tests      | Prevent dotenv from auto-loading .env file in spawned process      | 03.2-05                         |
| Remove Effect from packages/env for t3-env                    | Unified env validation approach (t3-env for both server and web)   | 03.3-01                         |
| No redaction in t3-env                                        | Server vars never exposed to client, acceptable tradeoff           | 03.3-01                         |
| vi.resetModules + dynamic import for env testing              | Tests manipulate process.env and reimport module for isolation     | 03.3-01                         |
| Explicit runtimeEnv destructuring for Next.js                 | Must use explicit access for build-time inlining to work           | 03.3-02                         |
| Use dotenv directly in drizzle.config.ts                      | drizzle-kit only needs DATABASE_URL, not full env validation       | 03.4-01                         |
| Use PgClient.layer() over layerConfig() for tests             | layerConfig() requires ConfigProvider; layer() accepts direct config | 03.4-02                         |
| Use Redacted.make() for URL in test layer                     | PgClient expects Redacted type for url field                        | 03.4-02                         |
| vi.mock for env isolation in integration tests                | Cleaner than process.env mutation for t3-env import-time validation | 03.4-03                         |
| Dynamic import after vi.mock setup                            | Required for mock to take effect before module initialization       | 03.4-03                         |
| better-auth returns { token, user } not { session, user }     | Corrected from original assumption during test implementation       | 03.4-03                         |
| Use createCallerFactory for tRPC v11 testing                  | Modern pattern, deprecated createCaller still works but not recommended | 03.4-04                         |
| Form-scoped selectors for E2E button clicks                   | Avoids conflicts with navbar buttons that have same text                | 03.4-05                         |
| Keep temp dir + symlinks for web startup test                 | Next.js auto-reads .env from cwd, no flag to disable                    | 03.4-06                         |
| Use promisified exec for startup tests                        | Cleaner than manual spawn/promise wrapping                              | 03.4-06                         |
| Use @effect/sql-drizzle for schema CRUD tests                 | Schema tests use Effect database layers even though auth doesn't use Effect (no better-auth wrapper) | 03.4-07 |
| Effect.promise() for drizzle ops in Effect.gen                | Drizzle returns Promises, not Effects; wrap with Effect.promise()       | 03.4-07                         |
| Effect.either for constraint violation tests                  | Captures expected errors without throwing, check result._tag            | 03.4-07                         |
| hono/aws-lambda built into hono package                       | Not a separate @hono/aws-lambda package; use import from hono/aws-lambda| 04-01                           |
| Test mocks must include all required env vars                 | When adding new env vars to server schema, update all vi.mock calls     | 04-01                           |
| fileParallelism: false for database tests                     | Database integration tests cause race conditions when run in parallel   | 04-01                           |
| Underscore prefix for side-effect imports                     | SST infra imports are for side effects (registering resources), not usage | 04-02                           |
| Neon dual URL pattern (direct + pooled)                       | Direct URL for migrations (DDL), pooled for Lambda (connection reuse)   | 04-02                           |
| Dual entrypoint pattern for server                            | app.ts (shared) + lambda.ts/serve.ts (platform-specific entrypoints)    | 04-03                           |
| Conditional streaming via SST_DEV                             | streamHandle for prod, handle for sst dev (proxy limitation)            | 04-03                           |
| --ignore-unfixable for pnpm audit                             | SST transitive deps have unfixable vulns (opencontrol -> old hono)      | 04-03                           |

### Pending Todos

None.

### Blockers/Concerns

- Pre-existing lint issues remain in mode-toggle.tsx, label.tsx, .agent/prd.json
  (not in scope of 01-07)
- Docker socket access needed for integration tests (environment-specific)
- Playwright browser dependencies needed for E2E tests (environment-specific)

**Security Status (resolved in 03.1-09):**

- All 5 security findings resolved
- SEC-001 (Input validation) FIXED in 03.1-08
- SEC-002 (Rate limiting) FIXED in 03.1-08
- SEC-003 (Debug logging) FIXED in 03.1-07
- SEC-004 (Polar productId) CLOSED in 03.1-07
- SEC-005 (Polar sandbox) CLOSED in 03.1-07
- pnpm audit: No known vulnerabilities (lodash-es override added)

## Phase 1 Summary

Testing infrastructure complete - type check passes, targeted lint fixed:

| Plan  | Summary                                              | Duration | Status   |
| ----- | ---------------------------------------------------- | -------- | -------- |
| 01-01 | Vitest + Biome static analysis                       | 4 min    | Complete |
| 01-02 | Docker auto-start for integration tests              | 2 min    | Complete |
| 01-03 | Playwright E2E + Lefthook hooks + verify.sh          | 3 min    | Complete |
| 01-04 | Fix test bugs from UAT                               | 5 min    | Complete |
| 01-06 | Integration test convention (\*.integration.test.ts) | 4 min    | Complete |
| 01-07 | Fix pre-existing lint issues (ai/page, dashboard)    | 2 min    | Complete |
| 01-08 | Add missing hono dependency                          | <1 min   | Complete |

**Script Status (all working):**

- `pnpm test:unit` - Passes, excludes \*.int.test.ts
- `pnpm test:integration` - Uses vitest.integration.config.ts, discovers all
  packages
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

- `pnpm check` - Static analysis with Biome (fails: pre-existing lint issues
  outside plan scope)
- `pnpm check-types` - Type checking (PASSES)
- `pnpm test:unit` - Unit tests (PASSES)
- `pnpm test:integration` - Integration tests (works, needs Docker)
- `pnpm test:e2e` - E2E tests (works, needs Playwright deps)
- `pnpm verify:commit` - Pre-commit check (fails: pre-existing lint issues)
- `pnpm verify` - Full verification pipeline (fails: pre-existing lint issues)

## Phase 1.1 Summary

Test file convention migration complete:

| Plan    | Summary                         | Duration | Status   |
| ------- | ------------------------------- | -------- | -------- |
| 01.1-01 | Rename files and update configs | 2 min    | Complete |

**Convention Standardized:**

- `*.test.ts` - Unit tests (unchanged)
- `*.int.test.ts` - Integration tests (was \*.integration.test.ts)
- `*.e2e.test.ts` - E2E tests (was \*.spec.ts)

## Phase 2 Summary

Security workflow complete:

| Plan  | Summary                                     | Duration | Status   |
| ----- | ------------------------------------------- | -------- | -------- |
| 02-01 | Security verification workflow + pnpm audit | 3 min    | Complete |

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

| Plan  | Summary                                    | Duration | Status   |
| ----- | ------------------------------------------ | -------- | -------- |
| 03-01 | Core package foundation with Effect layers | 3 min    | Complete |
| 03-02 | Auth domain migration                      | 2 min    | Complete |
| 03-03 | Payment domain migration                   | 4 min    | Complete |
| 03-04 | Consumer migration to @gemhog/core         | 2 min    | Complete |
| 03-05 | Old package removal                        | 4 min    | Complete |

**packages/core created:**

- Effect database layers: PgLive, DrizzleLive, DatabaseLive
- Auth domain: simplified (no Effect wrapper after 03.1-04)
- Subpath exports: ./drizzle, ./auth, ./auth/auth.sql
- Integration test: connection.int.test.ts
- Note: Payment module removed in 03.1-02 (dead code)

**Old packages removed:**

- packages/db deleted (16 files)
- packages/auth deleted (6 files)
- Root db:\* scripts updated to @gemhog/core
- Unused @gemhog/auth dependency removed from apps/web

**Key Patterns Established:**

- Effect Context.Tag for service interfaces
- Effect Layer for dependency injection
- Deferred env validation via require() for testability
- Mock layers (\*ServiceTest) for unit testing

## Phase 3.1 Summary

Code review fixes complete:

| Plan    | Summary                                           | Duration | Status   |
| ------- | ------------------------------------------------- | -------- | -------- |
| 03.1-01 | Generate database migrations                      | 3 min    | Complete |
| 03.1-02 | Remove dead payment service code                  | 3 min    | Complete |
| 03.1-03 | Replace t3-env with Effect Config                 | 15 min   | Complete |
| 03.1-04 | Simplify auth by removing Effect wrapper          | 15 min   | Complete |
| 03.1-05 | Audit and remove unused dependencies              | 4 min    | Complete |
| 03.1-06 | Fix drizzle.config.ts to use @gemhog/env/server   | 6 min    | Complete |
| 03.1-07 | Auth cleanup (static imports, Polar removal)      | 2 min    | Complete |
| 03.1-08 | AI endpoint security (validation + rate limiting) | 7 min    | Complete |
| 03.1-09 | Security review and verification                  | 3 min    | Complete |

**Completed:**

- Generated initial database migrations (user, session, account, verification
  tables)
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
- Full verification pipeline passes (static, unit, integration, e2e, security
  audit)

## Phase 3.2 Summary

Code quality and TDD practices complete:

| Plan    | Summary                                        | Duration | Status   |
| ------- | ---------------------------------------------- | -------- | -------- |
| 03.2-01 | Remove dead code and archaeological comments   | 4 min    | Complete |
| 03.2-02 | Add unit tests for env validation              | 3 min    | Complete |
| 03.2-03 | E2E error detection fixture                    | 3 min    | Complete |
| 03.2-04 | TDD and comment standards documentation        | 2 min    | Complete |
| 03.2-05 | Startup failure integration tests              | 6 min    | Complete |
| 03.2-06 | Gap closure: confirmed web.ts cannot use Effect | 7 min    | Complete |

**Completed:**

- Removed dead code and archaeological comments from codebase
- Added unit tests for env validation schemas (Effect Config for server, plain function for web)
- E2E tests now use extended Playwright fixture that captures console.error and page exceptions
- TDD practices section added to TESTING.md with RED-GREEN-REFACTOR workflow
- Comment standards expanded in CONVENTIONS.md with concrete examples
- Startup failure integration tests spawn real processes (tsx, next build) and verify exit codes
- Full verification pipeline passes (static, unit, integration, e2e, security audit)
- Gap closure: Confirmed web.ts cannot use Effect Config (Next.js client needs direct process.env)

**Test Coverage Established:**

- Unit tests: env schema validation (packages/env)
- Unit tests: auth service (packages/core)
- Integration tests: database connection (packages/core)
- Integration tests: server startup failure (apps/server)
- Integration tests: web build failure (apps/web)
- E2E tests: homepage loads, error detection fixture (apps/web)

## Phase 3.3 Summary

Unifying env validation with t3-env - COMPLETE:

| Plan    | Summary                                        | Duration | Status   |
| ------- | ---------------------------------------------- | -------- | -------- |
| 03.3-01 | Server env migration to t3-env                 | 5 min    | Complete |
| 03.3-02 | Web env migration to t3-env                    | 3 min    | Complete |

**Completed:**

- Replaced Effect Config with @t3-oss/env-core in packages/env (server.ts)
- Replaced plain validation function with @t3-oss/env-nextjs (web.ts)
- Server env validates at import time using Zod schemas
- Web env validates at import time with explicit runtimeEnv for Next.js inlining
- Tests use vi.resetModules pattern for module isolation
- Consumers (auth.service.ts, drizzle.config.ts) access env vars as plain strings

**Patterns Established:**

- t3-env createEnv pattern for server env validation (@t3-oss/env-core)
- t3-env createEnv pattern for client env validation (@t3-oss/env-nextjs)
- Explicit runtimeEnv destructuring for Next.js build-time inlining
- vi.resetModules + process.env mutation for env schema testing
- Plain string access for env vars (no Redacted.value())

## Phase 3.4 Summary

Integration test coverage - COMPLETE:

| Plan    | Summary                                          | Duration | Status   |
| ------- | ------------------------------------------------ | -------- | -------- |
| 03.4-01 | Fix db:migrate env loading                       | 2 min    | Complete |
| 03.4-02 | Update connection tests to use @effect/vitest    | 3 min    | Complete |
| 03.4-03 | Auth flow integration tests                      | 21 min   | Complete |
| 03.4-04 | tRPC procedure tests                             | 1 min    | Complete |
| 03.4-05 | E2E auth tests (gap closure)                     | 4 min    | Complete |
| 03.4-06 | Simplify startup tests (gap closure)             | 5 min    | Complete |
| 03.4-07 | Schema CRUD integration tests (gap closure)      | 4 min    | Complete |

**Completed:**

- Fixed drizzle.config.ts to use dotenv directly (only needs DATABASE_URL)
- Refactored connection.int.test.ts to use @effect/vitest layer() pattern
- Added @effect/vitest ^0.27.0 as devDependency
- Tests use PgClient.layer() with explicit URL for test isolation
- Tests use SqlClient.SqlClient for Effect-based queries
- Auth flow integration tests with signup/signin via better-auth API
- Test fixtures for auth domain (truncateAuthTables, createTestUser)
- tRPC procedure integration tests for healthCheck and privateData
- Placeholder example.test.ts removed
- Schema CRUD tests for auth.sql.ts definitions (user, session, account, verification)
- Constraint verification (unique email, foreign keys)
- E2E Playwright tests for signup and signin UI flows (4 tests)
- Simplified startup tests using promisified exec (44% reduction for web, 24% for server)

**Patterns Established:**

- @effect/vitest layer() for Effect test context
- PgClient.layer() with Redacted.make() for test isolation
- SqlClient.SqlClient for Effect-based database queries
- vi.mock('@gemhog/env/server') + dynamic import for env isolation
- Test fixtures live with their domain (auth/test-fixtures.ts)
- createCallerFactory pattern for tRPC v11 testing
- Direct drizzle typed API for schema definition testing (separate from Effect layer)
- Form-scoped E2E selectors to avoid navbar button conflicts
- Unique email generation per E2E test for isolation

**Integration/E2E Test Coverage:**

- 8 test files, 29 tests total (17 integration + 6 E2E + 6 unit)
- apps/server: startup failure tests (4 tests)
- apps/web: startup failure test (1 test)
- packages/core/drizzle: connection tests (2 tests), migration tests (2 tests)
- packages/core/auth: auth flow tests (5 tests), schema CRUD tests (8 tests)
- packages/api: tRPC procedure tests (3 tests)
- apps/web/tests/e2e: auth E2E tests (4 tests), homepage E2E tests (2 tests)

## Phase 4 Summary

SST Deployment phase - IN PROGRESS:

| Plan    | Summary                                          | Duration | Status   |
| ------- | ------------------------------------------------ | -------- | -------- |
| 04-01   | SST dependencies and env validation fix          | 10 min   | Complete |
| 04-02   | SST config and infra structure                   | 4 min    | Complete |
| 04-03   | Lambda handler with streaming                    | 6 min    | Complete |
| 04-04   | Next.js deployment config                        | -        | Pending  |
| 04-05   | Secrets and domain configuration                 | -        | Pending  |

**Completed:**

- Added GOOGLE_GENERATIVE_AI_API_KEY to server env schema
- Installed sst ^3.17 as devDependency
- Verified hono/aws-lambda adapter available (built into hono)
- Fixed auth test mocks to include new required env var
- Fixed database test race condition with fileParallelism: false
- Created sst.config.ts with app config (eu-central-1, AWS + Cloudflare)
- Created infra/secrets.ts with 4 secrets (DatabaseUrl, DatabaseUrlPooler, BetterAuthSecret, GoogleApiKey)
- Created infra/neon.ts with Linkable exposing direct and pooled URLs
- Refactored server to dual entrypoints (app.ts shared, lambda.ts/serve.ts platform-specific)
- Lambda handler uses conditional streaming (streamHandle for prod, handle for sst dev)
- Fixed verify.sh to use --ignore-unfixable for SST transitive dependency vulnerabilities

## Session Continuity

Last session: 2026-01-22T20:08:26Z
Stopped at: Completed 04-03-PLAN.md (Lambda handler with streaming)
Resume file: None

Next: 04-04-PLAN.md (Next.js deployment config)
