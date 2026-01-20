# Testing Infrastructure

**Updated:** 2026-01-20

## Quick Reference

**Run full verification:**
```bash
pnpm db:start      # Start database (if not running)
pnpm verify        # Run ALL tests: static → types → unit → integration → security
```

This is THE command to verify everything works. Use it before declaring work complete.

## Current State

| Test Type | Status | Command | Notes |
|-----------|--------|---------|-------|
| Static Analysis | ✓ Working | `pnpm check` | Biome lint + format |
| Type Check | ✓ Working | `pnpm check-types` | TypeScript strict |
| Unit Tests | ✓ Working | `pnpm test:unit` | Vitest, 4 tests |
| Integration Tests | ✓ Working | `pnpm test:integration` | Requires `pnpm db:start` first |
| E2E Tests | ✓ Working | `pnpm test:e2e` | Playwright |
| Pre-commit Hooks | ✓ Working | Lefthook | Runs on git commit |
| Dependency Security | ⚠ Blocked | `pnpm audit` | esbuild moderate vuln (drizzle-kit dep) |
| **Full Pipeline** | ⚠ Blocked | `pnpm verify` | Blocked by dependency security |

## Verification Requirements

**Tests must pass before work is complete. "Runs but fails" is NOT acceptable.**

### When to Run What

| Change Type | Required Commands |
|-------------|-------------------|
| Any code change | `pnpm verify:commit` (static + types + unit) |
| Database/schema changes | `pnpm db:start && pnpm test:integration` |
| UI/user flow changes | `pnpm test:e2e` |
| Before merge/release | `pnpm db:start && pnpm verify` (full pipeline) |

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

# Unit tests (Vitest, all packages except db)
pnpm test:unit

# Integration tests (start database first)
pnpm db:start
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
- Config: `vitest.config.ts` (root) + per-package `vitest.config.ts` using `defineProject`
- Projects: apps/server, apps/web, packages/api, packages/core, packages/env
- Pattern: `*.test.ts` files
- Excludes: `*.int.test.ts`, `*.e2e.test.ts` (handled at root config level)

**Integration Tests:** Vitest 4.x
- Config: `vitest.integration.config.ts` (root)
- Prerequisite: `pnpm db:start` (must start database manually before running)
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

| Suffix | Type | Command | Description |
|--------|------|---------|-------------|
| `*.test.ts` | Unit | `pnpm test:unit` | Fast, mocked externals |
| `*.int.test.ts` | Integration | `pnpm test:integration` | Real DB, Docker required |
| `*.e2e.test.ts` | E2E | `pnpm test:e2e` | Playwright, full app |

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
2. Run `pnpm db:start` to start the PostgreSQL container
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

**Current blockers:**

1. **Dependency vulnerability** - `esbuild` moderate vulnerability via drizzle-kit. Blocks `pnpm verify`. Waiting for drizzle-kit to update dependency.

**Pre-existing issues (not blocking tests):**

1. Pre-existing lint issues in mode-toggle.tsx, label.tsx (outside phase scope)
2. Empty .agent/prd.json file (parse error)

These are documented in `.planning/codebase/CONCERNS.md`.

## Requirements for "Testing Complete"

Testing infrastructure is only complete when:

- [x] `pnpm check` passes (no lint errors)
- [x] `pnpm check-types` passes (no type errors)
- [x] `pnpm test:unit` passes (all unit tests green)
- [x] `pnpm test:integration` passes (with Docker running)
- [ ] `pnpm test:e2e` passes (with env vars configured) — requires Playwright deps
- [ ] `pnpm verify` passes (full pipeline green) — blocked by esbuild vuln

---

_Updated: 2026-01-20_
