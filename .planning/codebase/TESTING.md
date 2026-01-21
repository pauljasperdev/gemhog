# Testing Infrastructure

## MANDATORY: For executing Plans

### Before starting execution of plans

1. Install deps and start integration test infrastructure

```bash
pnpm dev:init && pnpm test:integration:up
```

2. You MUST verify `pnpm verify` has no prior erros. If so fix them!

3. There MUST NOT be any prior security issues. read
   `.planning/codebase/SECURITY-REVIEW.md`. If so fix them!

### Before marking a plan as complete

**This is non-negotiable.** ALL test MUST pass to mark a plan `pnpm verify`
passes. No exceptions. Not test skipping.

Security volnurabilites MUST have been audited and FIXED!

Review `.planning/codebase/SECURITY-REVIEW.md` and
`.planning/codebase/CONCERNS.md` if up to date. Fixed or not relevant issues due
to changing code base can be removed.

## Database Migrations

Migrations are managed via Drizzle Kit in `packages/core`.

### Commands

| Command            | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `pnpm db:generate` | Generate migrations from schema changes       |
| `pnpm db:migrate`  | Apply pending migrations                      |
| `pnpm db:push`     | Push schema directly (dev only, no migration) |
| `pnpm db:studio`   | Open Drizzle Studio GUI                       |

### Workflow

**After schema changes (packages/core/src/_/_.sql.ts):**

1. Run `pnpm db:generate` to create migration files
2. Review generated SQL in `packages/core/src/migrations/`
3. Commit migration files with schema changes
4. Run `pnpm db:migrate` to apply (or let integration tests do it)

**Production deployment:**

- Run `pnpm db:migrate` before starting the application
- Migrations are idempotent (safe to run multiple times)

## Available Test Commands

| Test Type           | Command                 | Notes                               |
| ------------------- | ----------------------- | ----------------------------------- |
| Static Analysis     | `pnpm check`            | Biome lint + format                 |
| Type Check          | `pnpm check-types`      | TypeScript strict                   |
| Unit Tests          | `pnpm test:unit`        | Vitest                              |
| Integration Tests   | `pnpm test:integration` | Requires `pnpm db:start` first      |
| E2E Tests           | `pnpm test:e2e`         | Playwright, auto-starts dev servers |
| Pre-commit Hooks    | Lefthook                | Runs on git commit                  |
| Dependency Security | `pnpm security:audit`   | Checks for vulnerable dependencies  |
| **Full Pipeline**   | `pnpm verify`           | Runs all of the above               |

## Verification Requirements

**Tests must pass before work is complete. "Runs but fails" is NOT acceptable.**

### Agent Rules

1. **Run tests BEFORE declaring work complete** — not after
2. **Fix failures before committing** — don't commit broken code
3. **Pre-existing failures are blockers** — document in CONCERNS.md but don't
   ignore them
4. **Infrastructure changes require working tests** — if you add test tooling,
   verify it actually works end-to-end

### FORBIDDEN: Modifying Tests to Pass

**Agents are NEVER allowed to:**

- Modify `verify.sh` or test scripts to skip tests
- Add conditionals that bypass test execution (e.g., "if Docker not available,
  skip")
- Change test configs to exclude failing tests
- Mark tests as `.skip()` or `.todo()` to avoid failures
- Silence test output or errors
- Report "ALL TESTS PASSED" when tests were skipped

**If tests cannot run due to missing infrastructure:**

1. **STOP** — Do not mark the plan as complete
2. **REPORT** — "Cannot complete verification: [reason]"
3. **ASK** — "Docker/Playwright not available. How should I proceed?"

The user decides whether to:

- Provide the missing infrastructure
- Explicitly skip verification for this plan (user's choice, not agent's)
- Abort the plan

**Skipping tests is a USER decision, never an agent decision.**

### When to Run What

| When                         | Command                                      |
| ---------------------------- | -------------------------------------------- |
| Any code change              | `pnpm verify:commit` (static + types + unit) |
| Database/schema changes      | `pnpm test:integration`                      |
| UI/user flow changes         | `pnpm test:e2e`                              |
| **Before completing a plan** | `pnpm verify` (full pipeline)                |
| Before merge/release         | `pnpm verify` (full pipeline)                |

### Verification Order (Fail Fast, Expensive Last)

```
1. Static Analysis (pnpm check)      - Biome lint, ~1s
2. Type Check (pnpm check-types)     - TypeScript strict, ~3s
3. Unit Tests (pnpm test:unit)       - Vitest, mocked externals, ~1s
4. Integration Tests                  - Docker + Postgres required
5. E2E Tests                         - Full app startup, Playwright
```

Run cheap/fast tests first. Stop on first failure.

## Test Commands

```bash
# Static analysis (Biome lint + format check)
pnpm check

# Type checking
pnpm check-types

# Unit tests (Vitest, all packages)
pnpm test:unit

# Integration tests (start database first)
pnpm test:integration:up
pnpm test:integration

# E2E tests (requires env vars, starts dev servers)
pnpm test:e2e

# Pre-commit equivalent (manual)
pnpm verify:commit

# Full verification pipeline
pnpm verify
```

## Test Framework

**Unit Tests:** Vitest 4.x

- Config: `vitest.config.ts` (root) + per-package `vitest.config.ts` using
  `defineProject`
- Projects: apps/server, apps/web, packages/api, packages/core, packages/env
- Pattern: `*.test.ts` files
- Excludes: `*.int.test.ts`, `*.e2e.test.ts` (handled at root config level)

**Integration Tests:** Vitest 4.x

- Config: `vitest.integration.config.ts` (root)
- Pattern: `*.int.test.ts` files
- Discovered via glob across all packages

**E2E:** Playwright

- Config: `playwright.config.ts`
- Tests: `apps/web/tests/e2e/*.e2e.test.ts`
- Auto-starts dev servers via webServer config

**Pre-commit:** Lefthook

- Config: `lefthook.yml`
- Runs: biome (staged files) + typecheck

## Vitest Configuration Structure

The project uses a monorepo Vitest setup with workspace discovery:

```
vitest.config.ts              # Root: discovers projects, global excludes
vitest.integration.config.ts  # Root: integration test config (separate run)
├── apps/server/vitest.config.ts   # defineProject: name, environment
├── apps/web/vitest.config.ts      # defineProject: name, environment, paths
├── packages/api/vitest.config.ts
├── packages/core/vitest.config.ts
└── packages/env/vitest.config.ts
```

**Root config responsibilities:**

- Workspace discovery via `projects: ["apps/*", "packages/*"]`
- Global excludes: `*.int.test.ts`, `*.e2e.test.ts`, `node_modules`, `dist`
- Coverage configuration

**Package config responsibilities (using `defineProject`):**

- Package name for test output
- Environment: `node` (server/api/core/env) or `happy-dom` (web)
- Include patterns (most use `src/**/*.test.ts`)
- Note: `apps/web` also includes `app/**/*.test.ts` for Next.js App Router

## Test File Naming Convention

Tests are co-located with implementation using clear suffixes:

| Suffix          | Type        | Command                 | Description              |
| --------------- | ----------- | ----------------------- | ------------------------ |
| `*.test.ts`     | Unit        | `pnpm test:unit`        | Fast, mocked externals   |
| `*.int.test.ts` | Integration | `pnpm test:integration` | Real DB, Docker required |
| `*.e2e.test.ts` | E2E         | `pnpm test:e2e`         | Playwright, full app     |

**Example structure:**

```
src/
  users.ts
  users.test.ts       # Unit test (mocked DB)
  users.int.test.ts   # Integration test (real DB)
  auth/
    login.ts
    login.test.ts     # Unit test
```

## Adding Integration Tests

Any package can have integration tests. Simply:

1. Create `src/something.int.test.ts` (co-located with implementation)
2. Run `pnpm db:integraion:up` to start the infra
3. Run `pnpm test:integration` - tests are automatically discovered and run

The `vitest.integration.config.ts` discovers all `*.int.test.ts` files across:

- `apps/**/src/**/*.int.test.ts`
- `packages/**/src/**/*.int.test.ts`

## Test Patterns

### Unit Test Structure

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("ModuleName", () => {
  describe("functionName", () => {
    beforeEach(() => {
      // reset state
    });

    it("should handle valid input", () => {
      // arrange
      const input = "test";

      // act
      const result = functionName(input);

      // assert
      expect(result).toBe("expected");
    });
  });
});
```

### Integration Test (Database)

```typescript
import { describe, it, expect } from "vitest";
import { db } from "../client";

describe("Database Connection", () => {
  it("should connect and query", async () => {
    const result = await db.execute("SELECT 1 as value");
    expect(result.rows[0].value).toBe(1);
  });
});
```

### E2E Test (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load and display title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Gemhog/);
  });
});
```

### tRPC Procedure Test

```typescript
import { describe, it, expect } from "vitest";
import { appRouter } from "@gemhog/api/routers";

describe("Health Check", () => {
  it("should return OK", async () => {
    const caller = appRouter.createCaller({
      session: null,
    });

    const result = await caller.healthCheck();
    expect(result).toBe("OK");
  });
});
```

## TDD Workflow: Red-Green-Refactor

Test-Driven Development follows a strict cycle:

1. **RED**: Write a failing test that describes the behavior you want
2. **GREEN**: Write the minimum code to make the test pass
3. **REFACTOR**: Clean up while keeping tests green

### Why "Red First" Matters

- **Proves the test works**: A test that never fails might not test anything
- **Forces interface design**: Think about how code will be used before implementing
- **Creates living documentation**: Tests describe expected behavior

### TDD Workflow Example

```bash
# 1. Write the test (it should fail)
pnpm test:unit -- --run src/feature.test.ts
# Expected: FAIL - feature not implemented yet

# 2. Implement the feature
# ... write code ...

# 3. Run test again (it should pass)
pnpm test:unit -- --run src/feature.test.ts
# Expected: PASS

# 4. Refactor if needed, keep tests green
```

### When to Use TDD

**Good candidates for TDD:**

- Business logic with defined inputs/outputs
- API endpoints with request/response contracts
- Data transformations, parsing, formatting
- Validation rules

**Skip TDD for:**

- UI layout and styling
- Configuration changes
- Simple CRUD with no business logic
- One-off scripts

## What to Mock

**DO mock:**

- External API calls (Google AI, Polar)
- Time/dates for deterministic tests
- Environment variables

**DON'T mock:**

- Internal pure functions
- Database in integration tests (use real Docker DB)
- HTTP in E2E tests (use real servers)

## Known Issues

See `.planning/codebase/CONCERNS.md` for current known issues and tech debt.
