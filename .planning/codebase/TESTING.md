# Testing Patterns

**Analysis Date:** 2026-01-15

## Test Framework

**Runner:**
- Not configured (no test framework installed)

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands configured
# Recommended setup if adding tests:
# pnpm test                    # Run all tests
# pnpm test -- --watch         # Watch mode
# pnpm test -- path/to/file    # Single file
```

## Test File Organization

**Location:**
- No test files found in codebase
- Recommended: Co-locate tests (`*.test.ts` alongside source)

**Naming:**
- No convention established
- Recommended: `*.test.ts` or `*.spec.ts`

**Structure:**
```
# Recommended structure:
src/
  lib/
    utils.ts
    utils.test.ts
  services/
    auth-service.ts
    auth-service.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
// Recommended pattern (if tests are added):
import { describe, it, expect, beforeEach } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // reset state
    });

    it('should handle valid input', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

**Patterns:**
- Not established (no tests exist)
- Recommended: beforeEach for per-test setup
- Recommended: arrange/act/assert structure

## Mocking

**Framework:**
- Not configured

**Patterns:**
- Not established

**What to Mock (Recommended):**
- External API calls (Google AI, Polar)
- Database operations
- Environment variables

**What NOT to Mock:**
- Internal pure functions
- Simple utilities

## Fixtures and Factories

**Test Data:**
- Not established

**Location:**
- Recommended: `tests/fixtures/` for shared fixtures
- Recommended: Factory functions in test files

## Coverage

**Requirements:**
- Not configured

**Configuration:**
- No coverage tools installed

**View Coverage:**
```bash
# No coverage configured
# Recommended: pnpm run test:coverage
```

## Test Types

**Unit Tests:**
- Not implemented
- Recommended for: API procedures, utility functions

**Integration Tests:**
- Not implemented
- Recommended for: Auth flows, database operations

**E2E Tests:**
- Not implemented
- Recommended for: Full user flows (sign-up, checkout)

## Common Patterns

**Async Testing:**
```typescript
// Recommended pattern:
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
// Recommended pattern:
it('should throw on invalid input', () => {
  expect(() => functionCall()).toThrow('error message');
});
```

**tRPC Testing (Recommended):**
```typescript
// Test procedure with mock context
import { appRouter } from '@gemhog/api/routers';

const caller = appRouter.createCaller({
  session: null, // or mock session
});

it('should return OK', async () => {
  const result = await caller.healthCheck();
  expect(result).toBe('OK');
});
```

**Snapshot Testing:**
- Not used

## Recommendations

Since no testing infrastructure exists, consider:

1. **Add Vitest** for fast TypeScript testing
   ```bash
   pnpm add -D vitest @vitest/coverage-v8
   ```

2. **Add test scripts** to root `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

3. **Priority test areas:**
   - Authentication flows (`packages/auth/`)
   - API procedures (`packages/api/`)
   - Critical UI components (forms)

---

*Testing analysis: 2026-01-15*
*Update when test patterns change*
