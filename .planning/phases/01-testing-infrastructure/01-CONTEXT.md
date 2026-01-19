# Phase 1: Testing Infrastructure - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish all testing layers (static, unit, integration, E2E) with single-command execution. Tests verify code correctness for agents and developers. This phase sets up the infrastructure; security workflow and agent verification guidance are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Test execution flow
- Single command runs all tests in sequence: static → unit → integration → E2E
- Fail-fast: if any stage fails, stop immediately (don't run remaining stages)
- Auto-start Docker containers for integration tests if not running
- Auto-start dev server for E2E tests if not running

### Output and feedback
- Minimal verbosity by default: show pass/fail per stage, details only on failure
- On failure: show full stack trace with diff
- Terminal output only, no report file generation
- Always show summary at end (✓ static ✓ unit ✓ integration ✓ e2e)

### Local vs CI behavior
- Same commands locally and in CI (CI runs the same npm scripts)
- Docker required locally for integration tests
- For Test-stage AWS integration tests: env vars provide existing resource identifiers (bucket ARN, etc.), not AWS credentials — human deploys infrastructure
- Auto-detect CI environment via CI env var (GitHub Actions sets CI=true)

### Developer/Agent workflow
- Pre-commit hook runs: lint + unit tests + build
- Turborepo caching keeps incremental builds fast
- No watch mode needed
- Named command `npm run verify:commit` for pre-commit check (lint + unit + build)
- Full test suite (including integration/E2E) runs before completing a feature
- Primary users are agents, not human developers

### Claude's Discretion
- Docker compose configuration details
- Specific Vitest/Playwright configuration
- How to detect and wait for container/server readiness
- Exact pre-commit hook implementation (husky, lefthook, etc.)

</decisions>

<specifics>
## Specific Ideas

- Tests are primarily run by AI agents working on the project
- Agent workflow: verify:commit before each commit, full suite before completing features
- Turborepo should make incremental builds very fast due to caching

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-testing-infrastructure*
*Context gathered: 2026-01-19*
