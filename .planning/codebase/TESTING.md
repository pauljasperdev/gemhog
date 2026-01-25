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

**"pnpm verify passes" is NOT sufficient.** You must verify that tests actually
cover the new code. Passing tests mean nothing if they don't test what you built.

### CRITICAL: Everything MUST Be Tested

This is non-negotiable. Every new feature, every new code path, every new
configuration MUST have corresponding tests. No exceptions.

**Hard lessons learned:**

1. **New env vars added without tests** — Agent added `SENTRY_DSN` to env schema
   but no tests. Build passed because var was optional. Production would have
   failed silently. Now enforced by guardrail tests.

2. **Build config broken, tests passed** — `tsdown.config.ts` pointed to
   non-existent `index.ts`. No test caught this because there was no build test.
   Now enforced by `.env.example` build tests.

3. **Missing .env.example entries** — Agent added env var to schema but not to
   `.env.example`. Build failed on user's machine. Now caught by build tests.

4. **Platform-specific test failures** — Symlink-based tests passed on Linux,
   failed on Mac. Tests must be cross-platform.

### Mandatory Test Coverage

| What You Add | Required Test |
|--------------|---------------|
| New env var in schema | Unit test in `packages/env/src/*.test.ts` |
| New env var for builds | Entry in `apps/*/. env.example` |
| New API endpoint | Unit test + integration test |
| New UI component | Unit test (logic) + E2E test (user flow) |
| New database table | Migration test + query tests |
| New build config | Build test in `*.int.test.ts` |

### Guardrail Tests (Enforced Automatically)

These tests fail CI if you forget to add tests:

| Guardrail | Location | What it catches |
|-----------|----------|-----------------|
| Env var test coverage | `packages/env/src/*.test.ts` | Schema var without test |
| Build with .env.example | `apps/*/src/startup.int.test.ts` | Missing .env.example entry |

**If a guardrail test fails, you MUST add the missing test. Do not disable the
guardrail.**

### Agent Rules

1. **Run tests BEFORE declaring work complete** — not after
2. **Fix failures before committing** — don't commit broken code
3. **Pre-existing failures are blockers** — document in CONCERNS.md but don't
   ignore them
4. **Infrastructure changes require working tests** — if you add test tooling,
   verify it actually works end-to-end
5. **Verify tests actually test new code** — "pnpm verify passes" is not enough
   if you added code without tests
6. **New code = new tests** — every feature, endpoint, component, env var needs
   tests

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

**Effect Integration Tests:** @effect/vitest

- Config: Same as integration tests (`vitest.integration.config.ts`)
- Pattern: Use `layer()` and `it.effect()` from `@effect/vitest`
- Purpose: Test Effect layers with automatic setup/teardown

**Integration Tests:** Vitest 4.x

- Config: `vitest.integration.config.ts` (root)
- Pattern: `*.int.test.ts` files
- Discovered via glob across all packages

**E2E:** Playwright

- Config: `playwright.config.ts`
- Tests: `apps/web/tests/e2e/*.e2e.test.ts`
- Auto-starts dev servers via webServer config

### Playwright MCP Server (Interactive Debugging)

A Playwright MCP server is configured for Claude Code, providing interactive browser
control for debugging and UI verification. This is NOT required for standard
`pnpm verify` runs.

**Configuration:** `.mcp.json` (server entry point) and `playwright-mcp.config.json`
(browser options). The server runs headless Chromium in isolated mode.

**When to use Playwright MCP:**

- Debugging E2E test failures (visually inspect what's happening)
- After making UI changes (verify visual appearance and interactions)
- When introducing new user workflows (manually test the flow)
- When E2E tests pass but behavior seems wrong (visual confirmation)
- Investigating flaky E2E tests (step through interactively)

**When NOT to use Playwright MCP:**

- Standard `pnpm verify` runs (automated tests are sufficient)
- Backend-only changes (no UI impact)
- Unit or integration test debugging (no browser needed)

**Usage pattern for agents:**

1. Navigate to the relevant page with `browser_navigate`
2. Use `browser_snapshot` to understand page structure (preferred over screenshots)
3. Interact using `browser_click`, `browser_type`, `browser_fill_form`
4. Verify results with `browser_snapshot` or `browser_take_screenshot`
5. Close with `browser_close` when done

**Encourage usage when:**

- E2E tests are failing and logs aren't sufficient
- User reports a visual bug that tests don't catch
- Implementing new UI features that need visual verification
- Debugging client-side JavaScript issues

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

### Effect Layer Integration Test

```typescript
import { Effect } from "effect";
import { PgClient } from "@effect/sql-pg";
import { SqlClient } from "@effect/sql";
import { Redacted } from "effect";
import { expect, layer } from "@effect/vitest";

const TestPgLive = PgClient.layer({
  url: Redacted.make(process.env.DATABASE_URL ?? "postgres://..."),
});

layer(TestPgLive)("Effect layer tests", (it) => {
  it.effect("should connect and query", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const result = yield* sql`SELECT 1 as value`;
      expect(result[0].value).toBe(1);
    })
  );
});
```

### tRPC Procedure Test (Modern Pattern)

```typescript
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { t } from "../index";
import { appRouter } from "./index";

// Use createCallerFactory (tRPC v11 recommended pattern)
const createCaller = t.createCallerFactory(appRouter);

describe("Procedures", () => {
  it("should return OK for healthCheck", async () => {
    const caller = createCaller({ session: null });
    const result = await caller.healthCheck();
    expect(result).toBe("OK");
  });

  it("should reject unauthorized access", async () => {
    const caller = createCaller({ session: null });
    await expect(caller.privateData()).rejects.toThrow(TRPCError);
  });
});
```

### E2E Test (Playwright)

```typescript
// Import from fixtures for automatic error detection (console errors, page exceptions)
import { expect, test } from "./fixtures";

test.describe("Homepage", () => {
  test("should load and display title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Gemhog/);
  });
});
```

**Note:** Always import from `./fixtures` instead of `@playwright/test`. The fixtures
file extends Playwright with error detection that fails tests when the page has
console errors or JavaScript exceptions.

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
- **Forces interface design**: Think about how code will be used before
  implementing
- **Creates living documentation**: Tests describe expected behavior

### TDD is MANDATORY for New Features

**All new features that require testing MUST follow TDD:**

1. **Write the test FIRST** — before any implementation
2. **Run the test — it MUST FAIL** — this proves the test actually tests something
3. **Implement the feature** — minimum code to make the test pass
4. **Run the test — it MUST PASS** — proves implementation works
5. **Refactor if needed** — keep tests green

**If you cannot demonstrate the test fails before implementation, you have no
proof the test works.** A test that was written after the code and never failed
might be testing nothing.

**Example workflow:**

```bash
# 1. Write test for new env var validation
# packages/env/src/server.test.ts
it("should fail when NEW_VAR is missing", async () => {
  delete process.env.NEW_VAR;
  await expect(import("./server.js")).rejects.toThrow();
});

# 2. Run test - MUST FAIL (NEW_VAR not in schema yet)
pnpm test:unit -- packages/env/src/server.test.ts
# Expected: FAIL - NEW_VAR is not defined in schema

# 3. Add NEW_VAR to schema
# packages/env/src/server.ts
NEW_VAR: z.string().min(1),

# 4. Run test - MUST PASS
pnpm test:unit -- packages/env/src/server.test.ts
# Expected: PASS
```

**This applies to:**
- New env vars
- New API endpoints
- New validation rules
- New UI components with logic
- New database queries
- Guardrail tests

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

**TDD is required for:**

- Environment variables (schema + validation)
- Business logic with defined inputs/outputs
- API endpoints with request/response contracts
- Data transformations, parsing, formatting
- Validation rules
- Database queries and mutations
- Any feature that has testable behavior

**TDD is optional for:**

- Pure UI layout and styling (no logic)
- One-off scripts not committed to repo

**When in doubt, use TDD.** If something can fail, it needs a test. If it needs
a test, write the test first.

## Test Fixtures

Test fixtures live with their domain (co-located):

```
packages/core/src/auth/
├── auth.sql.ts         # Schema
├── auth.service.ts     # Service
├── auth.int.test.ts    # Integration tests
└── test-fixtures.ts    # Test utilities (truncation, factories)
```

**Example test fixture:**

```typescript
// packages/core/src/auth/test-fixtures.ts
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export async function truncateAuthTables(db: PostgresJsDatabase) {
  await db.execute(sql`TRUNCATE TABLE session, account, verification, "user" CASCADE`);
}

export function createTestUser() {
  return {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "testpassword123",
  };
}
```

## What to Mock

**DO mock:**

- External API calls (Google AI)
- Time/dates for deterministic tests
- Environment variables (use `vi.mock('@gemhog/env/server')` for t3-env isolation)

**DON'T mock:**

- Internal pure functions
- Database in integration tests (use real Docker DB)
- HTTP in E2E tests (use real servers)

## Known Issues

See `.planning/codebase/CONCERNS.md` for current known issues and tech debt.
