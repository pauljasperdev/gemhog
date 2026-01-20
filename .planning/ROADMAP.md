# Roadmap: Gemhog V0 (Foundation)

## Overview

V0 establishes the foundation: testing infrastructure, security workflow, core package consolidation with Effect TS, and SST deployment. This makes the repo restructure-ready, testable, security-checkable, and deployable before V1 features.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Testing Infrastructure** - Set up static, unit, integration, and E2E testing ✓
- [x] **Phase 1.1: Test File Convention Migration** - Migrate to *.test.ts, *.int.test.ts, *.e2e.test.ts convention (INSERTED) ✓
- [x] **Phase 2: Security Workflow** - Security review process as a blocking gate ✓
- [ ] **Phase 3: Core Consolidation** - Merge packages into domain-driven core with Effect TS
- [ ] **Phase 4: SST Deployment** - Deploy SST-agnostic application to AWS
- [ ] **Phase 5: Agent Verification** - Document and integrate full agent verification workflow

## Phase Details

### Phase 1: Testing Infrastructure
**Goal**: Establish all testing layers with single-command execution
**Depends on**: Nothing (first phase)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. Developer can run static analysis (Biome + TSC) via single command
  2. Developer can run unit tests (Vitest) with mocked externals via single command
  3. Developer can run integration tests against local Postgres Docker
  4. Developer can run integration tests against Test-stage AWS via env vars
  5. Developer can run E2E tests via Playwright MCP against localhost dev server
**Plans**: 8 plans

Plans:
- [x] 01-01-PLAN.md — Static analysis + Vitest unit test framework
- [x] 01-02-PLAN.md — Integration tests with Docker auto-start
- [x] 01-03-PLAN.md — E2E tests, pre-commit hooks, orchestration script
- [x] 01-04-PLAN.md — Fix UAT issues (integration script bug, E2E env vars)
- [x] 01-06-PLAN.md — Scalable integration test discovery with file suffix convention
- [ ] 01-07-PLAN.md — Fix Biome lint warnings in apps/web (gap closure)
- [ ] 01-08-PLAN.md — Fix TypeScript error - add hono to packages/api (gap closure)

### Phase 1.1: Test File Convention Migration (INSERTED)
**Goal**: Standardize test file naming: unit (*.test.ts), integration (*.int.test.ts), E2E (*.e2e.test.ts)
**Depends on**: Phase 1 (testing infrastructure must be in place)
**Requirements**: Derived from Phase 1 execution
**Success Criteria** (what must be TRUE):
  1. All unit tests use `*.test.ts` suffix
  2. All integration tests use `*.int.test.ts` suffix
  3. All E2E tests use `*.e2e.test.ts` suffix
  4. Scripts (vitest configs, verify.sh) updated to match new conventions
  5. Documentation (TESTING.md, STATE.md) reflects new convention
**Plans**: 1 plan

Plans:
- [x] 01.1-01-PLAN.md — Rename test files, update configs and documentation

### Phase 2: Security Workflow
**Goal**: Security verification as a blocking workflow gate
**Depends on**: Phase 1 (tests must work first)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Security review produces `SECURITY-REVIEW.md` with findings
  2. Critical/high findings are clearly marked as merge-blockers
  3. Ongoing concerns are tracked in `.planning/codebase/CONCERNS.md`
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Agent-driven security workflow documentation and pnpm audit integration

### Phase 3: Core Consolidation
**Goal**: Merge db + auth packages into domain-driven core with Effect TS
**Depends on**: Phase 2 (security baseline before restructure)
**Requirements**: INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. `packages/db` and `packages/auth` are merged into `packages/core`
  2. `packages/core` has domain-driven structure (auth/, payment/, drizzle/)
  3. Backend services use Effect TS with Layer for dependency injection
  4. Services are testable via Layer composition
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Create packages/core with Effect database layers
- [x] 03-02-PLAN.md — Migrate auth domain with Effect service wrapper
- [x] 03-03-PLAN.md — Create payment domain with Effect service wrapper
- [x] 03-04-PLAN.md — Update all consumers to import from @gemhog/core
- [x] 03-05-PLAN.md — Delete old packages and update root scripts

### Phase 4: SST Deployment
**Goal**: Deploy SST-agnostic application to AWS
**Depends on**: Phase 3 (core package structure must be stable)
**Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. Application deploys to AWS via `sst deploy`
  2. Application code has zero SST SDK imports
  3. Application reads all configuration from environment variables
  4. SST injects env vars at deploy time
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Agent Verification
**Goal**: Document and integrate full agent verification workflow
**Depends on**: Phase 4 (all testing and infrastructure must be ready)
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07
**Success Criteria** (what must be TRUE):
  1. Agent runs verification in order: static -> unit -> integration -> security -> E2E
  2. Agent knows when to run which test type based on change type
  3. Agent verification workflow is documented in `.planning/codebase/TESTING.md`
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 1.1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Testing Infrastructure | 7/7 | ✓ Complete | 2026-01-19 |
| 1.1 Test File Convention Migration | 1/1 | ✓ Complete | 2026-01-19 |
| 2. Security Workflow | 1/1 | ✓ Complete | 2026-01-19 |
| 3. Core Consolidation | 5/5 | ✓ Complete | 2026-01-20 |
| 4. SST Deployment | 0/? | Not started | - |
| 5. Agent Verification | 0/? | Not started | - |
