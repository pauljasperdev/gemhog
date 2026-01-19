# Phase 1: Testing Infrastructure - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning (updated after UAT)

<domain>
## Phase Boundary

Establish all testing layers (static, unit, integration, E2E) with single-command execution. Tests verify code correctness for agents and developers. This phase sets up the infrastructure; security workflow and agent verification guidance are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Integration test setup
- Auto-start Docker containers with notice: print "Starting Docker..." then proceed
- Filter integration tests via file suffix: `*.int.test.ts`
- Integration tests can exist anywhere in monorepo (not just packages/db)
- Docker health check timeout: 30 seconds

### E2E environment config
- E2E tests read from `.env` file (SST will generate this later via `sst shell --stage test`)
- Playwright webServer config starts dev server automatically
- Always start fresh server (no reuse, even locally) — consistent behavior
- Chromium only — sufficient coverage, faster execution

### Lint/type error handling
- Fix all pre-existing lint errors now (clean slate)
- Fix all pre-existing type errors now (clean slate)
- All fixes in one plan (01-04) with bug fixes — get Phase 1 done in one go
- Enable TypeScript strict mode going forward

### Test discovery pattern
- File suffixes: `*.test.ts` (unit), `*.int.test.ts` (integration), `*.e2e.test.ts` (E2E)
- Tests colocated with source files (foo.ts has foo.test.ts next to it)
- Vitest config explicitly excludes `*.int.test.ts` and `*.e2e.test.ts` from unit runs
- Rename existing tests to follow new convention

### Test execution flow (from original context)
- Single command runs all tests in sequence: static → unit → integration → E2E
- Fail-fast: if any stage fails, stop immediately
- Auto-start Docker containers for integration tests if not running
- Auto-start dev server for E2E tests if not running

### Output and feedback (from original context)
- Minimal verbosity by default: show pass/fail per stage, details only on failure
- On failure: show full stack trace with diff
- Terminal output only, no report file generation
- Always show summary at end (✓ static ✓ unit ✓ integration ✓ e2e)

### Local vs CI behavior (from original context)
- Same commands locally and in CI
- Docker required locally for integration tests
- For Test-stage AWS: env vars provide resource identifiers, human deploys infrastructure
- Auto-detect CI via CI env var

### Developer/Agent workflow (from original context)
- Pre-commit hook runs: lint + unit tests + build
- Named command `pnpm verify:commit` for pre-commit check
- Full test suite runs before completing a feature
- Primary users are agents, not human developers

### Claude's Discretion
- Docker compose configuration details
- Specific Vitest/Playwright configuration beyond decisions above
- How to detect and wait for container/server readiness
- Exact pre-commit hook implementation

</decisions>

<specifics>
## Specific Ideas

- Tests are primarily run by AI agents working on the project
- Agent workflow: verify:commit before each commit, full suite before completing features
- E2E will eventually use SST-generated .env via `sst shell --stage test`
- "int" suffix chosen for brevity over "integration"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-testing-infrastructure*
*Context gathered: 2026-01-19 (updated)*
