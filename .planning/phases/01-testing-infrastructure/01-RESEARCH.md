# Phase 1: Testing Infrastructure - Research

**Researched:** 2026-01-19
**Domain:** Testing infrastructure for pnpm monorepo (static analysis, unit, integration, E2E)
**Confidence:** HIGH

## Summary

This phase establishes testing infrastructure for a pnpm monorepo with Next.js frontend and Hono backend. The codebase already has Biome configured for linting/formatting but no testing framework installed. Docker Compose exists for PostgreSQL with healthcheck configured.

The standard approach for this stack is:
- **Static analysis**: Biome (already configured) + TypeScript strict mode (already configured)
- **Unit/Integration tests**: Vitest with workspace projects configuration
- **E2E tests**: Playwright with webServer auto-start
- **Pre-commit hooks**: Lefthook (faster than Husky, better for monorepos)
- **Test orchestration**: Shell script for fail-fast sequential execution

**Primary recommendation:** Use Vitest 3.2+ with projects configuration (not deprecated workspace files), Lefthook for git hooks, and a custom shell script to orchestrate the test pipeline with fail-fast behavior and auto-start capabilities.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | ^3.2.0 | Unit and integration testing | Fast, ESM-native, Vite-compatible, monorepo support via projects |
| @vitest/coverage-v8 | ^3.2.0 | Code coverage | Native V8 coverage, fast, accurate since v3.2 AST remapping |
| @playwright/test | ^1.50.0 | E2E browser testing | Cross-browser, auto-wait, webServer integration |
| lefthook | ^1.10.0 | Git hooks | Fast Go binary, parallel execution, single YAML config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/ui | ^3.2.0 | Test UI | Interactive debugging during development |
| happy-dom | ^15.0.0 | DOM simulation | Unit testing React components without browser |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lefthook | Husky + lint-staged | Husky is more popular but slower, requires multiple config files |
| happy-dom | jsdom | jsdom is more complete but slower; happy-dom is 2-3x faster |
| V8 coverage | Istanbul | Istanbul was more accurate historically, but V8 matched accuracy in Vitest 3.2+ |

**Installation:**
```bash
pnpm add -D vitest @vitest/coverage-v8 @playwright/test lefthook happy-dom
npx playwright install --with-deps chromium
```

## Architecture Patterns

### Recommended Project Structure
```
/
├── vitest.config.ts           # Root config with projects
├── playwright.config.ts       # E2E config with webServer
├── lefthook.yml              # Pre-commit hooks
├── scripts/
│   └── verify.sh             # Orchestration script
├── apps/
│   ├── web/
│   │   ├── vitest.config.ts  # Web-specific config (uses defineProject)
│   │   └── tests/
│   │       └── e2e/          # Playwright tests
│   └── server/
│       ├── vitest.config.ts  # Server-specific config
│       └── src/
│           └── *.test.ts     # Co-located unit tests
└── packages/
    ├── api/
    │   └── src/
    │       └── *.test.ts     # Co-located tests
    ├── auth/
    │   └── src/
    │       └── *.test.ts
    └── db/
        └── src/
            └── *.test.ts     # Integration tests
```

### Pattern 1: Vitest Projects Configuration (Vitest 3.2+)

**What:** Define multiple test projects in a single root config using `projects` option (workspace files deprecated since v3.2).

**When to use:** Monorepos with multiple packages/apps that need different test configurations.

**Example:**
```typescript
// vitest.config.ts (root)
// Source: https://vitest.dev/guide/projects
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'apps/*',
      'packages/*',
    ],
    // Global options only - reporters, coverage
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['**/src/**'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts'],
    },
  },
})
```

```typescript
// packages/api/vitest.config.ts (project-specific)
// Source: https://vitest.dev/guide/projects
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@gemhog/api',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

### Pattern 2: Playwright webServer Auto-start

**What:** Automatically start dev servers before E2E tests run.

**When to use:** E2E tests that need both frontend and backend servers running.

**Example:**
```typescript
// playwright.config.ts
// Source: https://playwright.dev/docs/test-webserver
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm dev:server',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

### Pattern 3: Docker Container Auto-start for Integration Tests

**What:** Use globalSetup to ensure Docker containers are running before integration tests.

**When to use:** Integration tests that need PostgreSQL or other containerized services.

**Example:**
```typescript
// packages/db/vitest.config.ts
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: '@gemhog/db',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['./test/global-setup.ts'],
    hookTimeout: 60000,
  },
})
```

```typescript
// packages/db/test/global-setup.ts
import { execSync } from 'child_process'

export async function setup() {
  // Check if container is running
  try {
    execSync('docker compose ps --filter status=running | grep gemhog-postgres', {
      cwd: process.cwd(),
      stdio: 'pipe',
    })
    console.log('PostgreSQL container already running')
  } catch {
    console.log('Starting PostgreSQL container...')
    execSync('docker compose up -d', { cwd: process.cwd(), stdio: 'inherit' })
    // Wait for healthcheck
    await waitForPostgres()
  }
}

async function waitForPostgres(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      execSync('docker compose exec -T postgres pg_isready -U postgres', {
        cwd: process.cwd(),
        stdio: 'pipe',
      })
      return
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('PostgreSQL did not become ready in time')
}
```

### Pattern 4: Fail-fast Test Orchestration Script

**What:** Shell script that runs tests in sequence, stopping on first failure.

**When to use:** The main verify command that runs all test stages.

**Example:**
```bash
#!/bin/bash
# scripts/verify.sh
set -e  # Exit on first error (fail-fast)

echo "=== Static Analysis ==="
pnpm check && pnpm check-types
echo "OK static"

echo "=== Unit Tests ==="
pnpm test:unit
echo "OK unit"

echo "=== Integration Tests ==="
pnpm test:integration
echo "OK integration"

echo "=== E2E Tests ==="
pnpm test:e2e
echo "OK e2e"

echo ""
echo "=== All tests passed ==="
```

### Anti-Patterns to Avoid
- **Workspace files for Vitest:** Deprecated since v3.2. Use `projects` in root config instead.
- **Running turbo for test orchestration:** Turbo parallelizes by default, but test stages must run sequentially (static before unit, etc.). Use shell script for orchestration.
- **Putting global options in project configs:** Projects can't configure reporters, coverage. Put those in root config only.
- **Using `defineConfig` in project files:** Use `defineProject` for type safety - it restricts to project-only options.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Container healthcheck waiting | Custom polling loop | Docker Compose healthcheck + depends_on condition | Built into Docker, more reliable |
| Staged file filtering for hooks | Shell script with git diff | Lefthook's `{staged_files}` | Handles edge cases, escaping |
| Dev server waiting | Custom http polling | Playwright webServer with url check | Automatic, handles timeout |
| Test file isolation | Manual cleanup | Vitest's test isolation | Guaranteed per-test isolation |
| Coverage reporting | Custom collection | @vitest/coverage-v8 | V8 native, accurate since 3.2 |

**Key insight:** Testing infrastructure has many edge cases (flaky startup, cleanup, isolation). Standard tools handle these; custom solutions often miss edge cases that surface in CI.

## Common Pitfalls

### Pitfall 1: Vitest workspace vs projects confusion
**What goes wrong:** Creating `vitest.workspace.ts` files that don't work in Vitest 3.2+.
**Why it happens:** Many tutorials and older docs reference workspace files.
**How to avoid:** Use `projects` array in root `vitest.config.ts`. Check Vitest version is 3.2+.
**Warning signs:** "workspace is deprecated" warnings in console.

### Pitfall 2: Docker container not ready
**What goes wrong:** Integration tests fail randomly because PostgreSQL isn't accepting connections.
**Why it happens:** Docker reports container "running" before service is ready.
**How to avoid:** Use healthcheck in docker-compose.yml (already configured) AND wait for it in globalSetup.
**Warning signs:** Connection refused errors that pass on retry.

### Pitfall 3: E2E tests expecting server that's not running
**What goes wrong:** Playwright tests fail with connection refused.
**Why it happens:** webServer config missing or wrong port/URL.
**How to avoid:** Configure webServer array with both frontend and backend servers, set appropriate timeouts.
**Warning signs:** "Timed out waiting for server" errors.

### Pitfall 4: Pre-commit hooks not running
**What goes wrong:** Commits go through without validation.
**Why it happens:** Lefthook not installed, or hooks not activated.
**How to avoid:** Run `lefthook install` after setup, add to postinstall script.
**Warning signs:** No output during commit.

### Pitfall 5: Test isolation failures in integration tests
**What goes wrong:** Tests pass individually but fail when run together.
**Why it happens:** Database state bleeding between tests.
**How to avoid:** Use transaction rollback pattern, or truncate tables in beforeEach.
**Warning signs:** Test order affects results.

### Pitfall 6: Wrong exit codes in CI
**What goes wrong:** CI shows green when tests actually failed.
**Why it happens:** Script doesn't propagate exit codes, or `set -e` not used.
**How to avoid:** Use `set -e` in shell scripts, verify `--error-on-warnings` for Biome.
**Warning signs:** CI passes but local failures observed.

## Code Examples

Verified patterns from official sources:

### Biome Check Command (CI-safe)
```bash
# Source: https://biomejs.dev/reference/cli/
# Runs formatter, linter, import sorting with exit code 1 on errors
biome check .

# Also exit with error on warnings (recommended for CI)
biome check --error-on-warnings .

# With auto-fix (for pre-commit)
biome check --write .
```

### Lefthook Pre-commit Configuration
```yaml
# lefthook.yml
# Source: https://biomejs.dev/recipes/git-hooks/
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc}"
      run: npx biome check --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
    typecheck:
      run: pnpm check-types
    unit:
      run: pnpm test:unit
```

### Vitest Unit Test Example
```typescript
// packages/api/src/routers/health.test.ts
// Source: https://vitest.dev/guide/
import { describe, it, expect } from 'vitest'
import { appRouter } from './index'

describe('healthCheck', () => {
  it('should return OK', async () => {
    const caller = appRouter.createCaller({ session: null })
    const result = await caller.healthCheck()
    expect(result).toBe('OK')
  })
})
```

### Vitest Integration Test with Database
```typescript
// packages/db/src/users.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './index'
import { users } from './schema'

describe('users table', () => {
  beforeEach(async () => {
    // Clean state for each test
    await db.delete(users)
  })

  it('should insert and retrieve user', async () => {
    await db.insert(users).values({ email: 'test@example.com', name: 'Test' })
    const result = await db.select().from(users)
    expect(result).toHaveLength(1)
    expect(result[0]?.email).toBe('test@example.com')
  })
})
```

### Playwright E2E Test Example
```typescript
// apps/web/tests/e2e/home.spec.ts
// Source: https://nextjs.org/docs/pages/guides/testing/playwright
import { test, expect } from '@playwright/test'

test('homepage has title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Gemhog/)
})

test('can navigate to sign in', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/.*sign-in/)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| vitest.workspace.ts | projects in vitest.config.ts | Vitest 3.2 (June 2025) | Single config file, simpler setup |
| Istanbul coverage | V8 coverage with AST remapping | Vitest 3.2 (June 2025) | Same accuracy as Istanbul, faster execution |
| Husky + lint-staged | Lefthook | 2024-2025 | Single config file, faster (Go binary), parallel execution |
| wait-for-it scripts | Docker Compose healthcheck | Docker Compose v2+ | Native solution, more reliable |

**Deprecated/outdated:**
- `vitest.workspace.ts` / `vitest.workspace.json`: Use `projects` array in root config instead
- Husky with separate lint-staged config: Works but slower and more complex than Lefthook

## Open Questions

Things that couldn't be fully resolved:

1. **Playwright MCP vs Standard Playwright**
   - What we know: CONTEXT.md mentions "Playwright MCP" for E2E tests. Playwright MCP is for AI-assisted test generation, not running tests.
   - What's unclear: Whether standard Playwright tests or MCP-assisted generation is intended.
   - Recommendation: Set up standard Playwright infrastructure. MCP can be used by agents to generate tests, but the test runner is standard Playwright.

2. **Test-stage AWS resources**
   - What we know: Integration tests can optionally run against Test-stage AWS resources via env vars.
   - What's unclear: What specific AWS resources need testing, what env vars to expect.
   - Recommendation: Set up infrastructure for local Docker tests first. AWS integration can use same test files with different DATABASE_URL etc.

## Sources

### Primary (HIGH confidence)
- [Vitest Projects Guide](https://vitest.dev/guide/projects) - Monorepo configuration with projects
- [Vitest Coverage](https://vitest.dev/guide/coverage) - V8 coverage configuration
- [Vitest globalSetup](https://vitest.dev/config/globalsetup) - Setup/teardown for integration tests
- [Biome CLI Reference](https://biomejs.dev/reference/cli/) - check command, exit codes
- [Biome Git Hooks Recipe](https://biomejs.dev/recipes/git-hooks/) - Lefthook configuration
- [Next.js Playwright Guide](https://nextjs.org/docs/pages/guides/testing/playwright) - webServer configuration

### Secondary (MEDIUM confidence)
- [Vitest 3.2 Release Notes](https://vitest.dev/blog/vitest-3-2.html) - workspace deprecation, AST coverage
- [Playwright webServer docs](https://playwright.dev/docs/test-webserver) - Multi-server configuration
- [Lefthook vs Husky comparison](https://dev.to/saltyshiomix/saying-goodbye-to-husky-how-lefthook-supercharged-our-typescript-workflow-35c8) - Performance comparison

### Tertiary (LOW confidence)
- [Turborepo Vitest guide](https://turborepo.dev/docs/guides/tools/vitest) - General monorepo patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools verified via official documentation
- Architecture: HIGH - Patterns from official docs, verified for current versions
- Pitfalls: MEDIUM - Based on GitHub issues and community reports, not all personally verified

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - testing tools are stable)
