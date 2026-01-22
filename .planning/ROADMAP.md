# Roadmap: Gemhog V0 (Foundation)

## Overview

V0 establishes the foundation: testing infrastructure, security workflow, core
package consolidation with Effect TS, and SST deployment. This makes the repo
restructure-ready, testable, security-checkable, and deployable before V1
features.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Testing Infrastructure** - Set up static, unit, integration,
      and E2E testing ✓
- [x] **Phase 1.1: Test File Convention Migration** - Migrate to _.test.ts,
      _.int.test.ts, \*.e2e.test.ts convention (INSERTED) ✓
- [x] **Phase 2: Security Workflow** - Security review process as a blocking
      gate ✓
- [x] **Phase 3: Core Consolidation** - Merge packages into domain-driven core
      with Effect TS ✓
- [x] **Phase 3.1: Code Review Fixes** - Address code review findings (INSERTED)
      ✓
- [ ] **Phase 3.2: Code Quality & TDD Practices** - Dead code cleanup, test
      coverage, TDD guidance (INSERTED)
- [ ] **Phase 4: SST Deployment** - Deploy SST-agnostic application to AWS
- [ ] **Phase 5: Agent Verification** - Document and integrate full agent
      verification workflow

## Phase Details

### Phase 1: Testing Infrastructure

**Goal**: Establish all testing layers with single-command execution **Depends
on**: Nothing (first phase) **Requirements**: TEST-01, TEST-02, TEST-03,
TEST-04, TEST-05, TEST-06 **Success Criteria** (what must be TRUE):

1. Developer can run static analysis (Biome + TSC) via single command
2. Developer can run unit tests (Vitest) with mocked externals via single
   command
3. Developer can run integration tests against local Postgres Docker
4. Developer can run integration tests against Test-stage AWS via env vars
5. Developer can run E2E tests via Playwright MCP against localhost dev server
   **Plans**: 8 plans

Plans:

- [x] 01-01-PLAN.md — Static analysis + Vitest unit test framework
- [x] 01-02-PLAN.md — Integration tests with Docker auto-start
- [x] 01-03-PLAN.md — E2E tests, pre-commit hooks, orchestration script
- [x] 01-04-PLAN.md — Fix UAT issues (integration script bug, E2E env vars)
- [x] 01-06-PLAN.md — Scalable integration test discovery with file suffix
      convention
- [ ] 01-07-PLAN.md — Fix Biome lint warnings in apps/web (gap closure)
- [ ] 01-08-PLAN.md — Fix TypeScript error - add hono to packages/api (gap
      closure)

### Phase 1.1: Test File Convention Migration (INSERTED)

**Goal**: Standardize test file naming: unit (_.test.ts), integration
(_.int.test.ts), E2E (\*.e2e.test.ts) **Depends on**: Phase 1 (testing
infrastructure must be in place) **Requirements**: Derived from Phase 1
execution **Success Criteria** (what must be TRUE):

1. All unit tests use `*.test.ts` suffix
2. All integration tests use `*.int.test.ts` suffix
3. All E2E tests use `*.e2e.test.ts` suffix
4. Scripts (vitest configs, verify.sh) updated to match new conventions
5. Documentation (TESTING.md, STATE.md) reflects new convention **Plans**: 1
   plan

Plans:

- [x] 01.1-01-PLAN.md — Rename test files, update configs and documentation

### Phase 2: Security Workflow

**Goal**: Security verification as a blocking workflow gate **Depends on**:
Phase 1 (tests must work first) **Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):

1. Security review produces `SECURITY-REVIEW.md` with findings
2. Critical/high findings are clearly marked as merge-blockers
3. Ongoing concerns are tracked in `.planning/codebase/CONCERNS.md` **Plans**: 1
   plan

Plans:

- [x] 02-01-PLAN.md — Agent-driven security workflow documentation and pnpm
      audit integration

### Phase 3: Core Consolidation

**Goal**: Merge db + auth packages into domain-driven core with Effect TS
**Depends on**: Phase 2 (security baseline before restructure) **Requirements**:
INFRA-03, INFRA-04 **Success Criteria** (what must be TRUE):

1. `packages/db` and `packages/auth` are merged into `packages/core`
2. `packages/core` has domain-driven structure (auth/, payment/, drizzle/)
3. Backend services use Effect TS with Layer for dependency injection
4. Services are testable via Layer composition **Plans**: 5 plans

Plans:

- [x] 03-01-PLAN.md — Create packages/core with Effect database layers
- [x] 03-02-PLAN.md — Migrate auth domain with Effect service wrapper
- [x] 03-03-PLAN.md — Create payment domain with Effect service wrapper
- [x] 03-04-PLAN.md — Update all consumers to import from @gemhog/core
- [x] 03-05-PLAN.md — Delete old packages and update root scripts

### Phase 3.1: Code Review Fixes (INSERTED)

**Goal**: Address code review findings before deployment **Depends on**: Phase 3
(core consolidation complete) **Requirements**: Derived from code review
(CODE_REVIEW.md) **Success Criteria** (what must be TRUE):

1. Database migrations exist and work (`pnpm db:generate`, `pnpm db:migrate`)
2. `drizzle.config.ts` uses `@gemhog/env/server` (no dotenv)
3. Payment service dead code is removed
4. Auth service has unnecessary Effect wrapper removed
5. t3-env replaced with Effect Config in `packages/env`
6. Unused dependencies audited and removed
7. Security findings SEC-001, SEC-002, SEC-003 resolved **Plans**: 9 plans

Plans:

- [x] 03.1-01-PLAN.md — Generate initial database migrations
- [x] 03.1-02-PLAN.md — Remove dead payment service code
- [x] 03.1-03-PLAN.md — Replace t3-env with Effect Config
- [x] 03.1-04-PLAN.md — Simplify auth service (remove Effect wrapper)
- [x] 03.1-05-PLAN.md — Audit and remove unused dependencies
- [x] 03.1-06-PLAN.md — Fix drizzle.config.ts env import (gap closure)
- [x] 03.1-07-PLAN.md — Complete auth cleanup and Polar removal (gap closure)
- [x] 03.1-08-PLAN.md — Add AI endpoint validation and rate limiting (gap
      closure)
- [x] 03.1-09-PLAN.md — Security review and verification (gap closure)

### Phase 3.2: Code Quality & TDD Practices (INSERTED)

**Goal**: Remove dead code, improve test coverage, establish TDD practices and
code standards **Depends on**: Phase 3.1 (code review fixes complete)
**Requirements**: Derived from code review (CODE_REVIEW.md round 2) **Success
Criteria** (what must be TRUE):

1. No archaeological comments in codebase (SEC-fix references, redundant test
   comments, etc.)
2. Unused `DatabaseError` and `ConnectionError` removed from
   `packages/core/src/drizzle/errors.ts`
3. Env schema validation has unit tests
4. Server/web startup failure on missing env vars has integration tests
5. E2E tests navigate to app pages and fail when app errors (TDD: red first)
6. TESTING.md documents TDD practices (write failing test first, then fix)
7. CONVENTIONS.md documents comment standards (explain why, not what was done)
8. packages/env/src/web.ts uses Effect Config (consistent with server.ts)
   **Plans**: 6 plans

Plans:

- [x] 03.2-01-PLAN.md — Dead code cleanup (comments + unused error classes)
- [x] 03.2-02-PLAN.md — Env schema validation unit tests
- [x] 03.2-03-PLAN.md — E2E error detection fixture
- [x] 03.2-04-PLAN.md — TDD and comment standards documentation
- [x] 03.2-05-PLAN.md — Server/web startup failure integration tests
- [ ] 03.2-06-PLAN.md — Restore Effect Config in web.ts (gap closure)

### Phase 4: SST Deployment

**Goal**: Deploy SST-agnostic application to AWS **Depends on**: Phase 3.2 (code
quality and TDD practices complete) **Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):

1. Application deploys to AWS via `sst deploy`
2. Application code has zero SST SDK imports
3. Application reads all configuration from environment variables
4. SST injects env vars at deploy time **Plans**: TBD

Plans:

- [ ] 04-01: TBD

### Phase 5: Agent Verification

**Goal**: Document and integrate full agent verification workflow **Depends
on**: Phase 4 (all testing and infrastructure must be ready) **Requirements**:
AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07 **Success
Criteria** (what must be TRUE):

1. Agent runs verification in order: static -> unit -> integration -> security
   -> E2E
2. Agent knows when to run which test type based on change type
3. Agent verification workflow is documented in `.planning/codebase/TESTING.md`
   **Plans**: TBD

Plans:

- [ ] 05-01: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 1 -> 1.1 -> 2 -> 3 -> 3.1
-> 3.2 -> 4 -> 5

| Phase                              | Plans Complete | Status      | Completed  |
| ---------------------------------- | -------------- | ----------- | ---------- |
| 1. Testing Infrastructure          | 7/7            | ✓ Complete  | 2026-01-19 |
| 1.1 Test File Convention Migration | 1/1            | ✓ Complete  | 2026-01-19 |
| 2. Security Workflow               | 1/1            | ✓ Complete  | 2026-01-19 |
| 3. Core Consolidation              | 5/5            | ✓ Complete  | 2026-01-20 |
| 3.1 Code Review Fixes              | 9/9            | ✓ Complete  | 2026-01-21 |
| 3.2 Code Quality & TDD Practices   | 5/6            | In Progress | -          |
| 4. SST Deployment                  | 0/?            | Not started | -          |
| 5. Agent Verification              | 0/?            | Not started | -          |
