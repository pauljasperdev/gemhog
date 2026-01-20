# Phase 3: Core Consolidation - Research

**Researched:** 2026-01-20
**Domain:** Package consolidation, Effect TS integration, domain-driven structure
**Confidence:** HIGH

## Summary

This phase consolidates `packages/db` and `packages/auth` into a unified `packages/core` with domain-driven organization and Effect TS for dependency injection. Research confirms Effect 3.x is the current standard with excellent Drizzle ORM integration via `@effect/sql-drizzle`. The migration is straightforward given the codebase's limited size (4 consumers of auth, 3 of db).

Effect TS provides compile-time dependency tracking via `Context.Tag` services and `Layer` composition, enabling mock layers for unit tests and real layers for integration tests. The codebase already uses Drizzle ORM, which has first-class Effect support through `@effect/sql-drizzle`.

**Primary recommendation:** Adopt Effect's service pattern with `Context.Tag` for domain services (Auth, Payment), compose via `Layer.merge`, and use `@effect/sql-drizzle` for database integration. Keep effect adoption backend-only per project constraints.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| effect | ^3.19 | Core Effect runtime | Current major version, active maintenance |
| @effect/sql-pg | ^0.45 | PostgreSQL Effect client | Official Effect PostgreSQL driver |
| @effect/sql-drizzle | ^0.45 | Drizzle + Effect integration | Bridges Effect connection pool to Drizzle ORM |
| @effect/vitest | ^0.45 | Vitest integration | Provides `it.effect`, `it.scoped` for testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | ^0.45 | ORM (already installed) | Schema definition, queries |
| better-auth | ^1.4 | Auth framework (already installed) | Authentication flows |
| @polar-sh/better-auth | ^1.1 | Payment plugin (already installed) | Payment integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @effect/sql-drizzle | Raw @effect/sql-pg | Lose Drizzle schema/query builder benefits |
| Context.Tag services | Plain classes | Lose compile-time dependency tracking |
| Layer composition | Manual DI | Lose automatic resource management |

**Installation:**
```bash
pnpm add effect @effect/sql-pg @effect/sql-drizzle
pnpm add -D @effect/vitest
```

## Architecture Patterns

### Recommended Project Structure
```
packages/core/
  src/
    drizzle/
      index.ts          # PgClient layer + DrizzleLive composition
    auth/
      auth.sql.ts       # Drizzle schema: user, session, account, verification
      auth.errors.ts    # Tagged errors: AuthError, SessionError
      auth.service.ts   # AuthService Context.Tag + implementation
      auth.mock.ts      # Mock AuthService layer for testing
      index.ts          # Exports: auth instance, AuthService, AuthLive
      auth.test.ts      # Unit tests with mock layers
      auth.int.test.ts  # Integration tests with real layers
    payment/
      payment.sql.ts    # Drizzle schema (if any future tables)
      payment.errors.ts # Tagged errors: PaymentError
      payment.service.ts# PaymentService Context.Tag
      payment.mock.ts   # Mock layer
      index.ts          # Exports
  docker-compose.yml    # Moved from packages/db
  drizzle.config.ts     # Schema glob: ./src/*/*.sql.ts
  package.json
```

### Pattern 1: Service Definition with Context.Tag
**What:** Define services as Context.Tag classes with typed interfaces
**When to use:** Any domain service requiring dependency injection
**Example:**
```typescript
// Source: https://effect.website/docs/requirements-management/services/
import { Context, Effect, Layer } from "effect";
import type { PgDrizzle } from "@effect/sql-drizzle/Pg";

// Service interface
interface AuthService {
  readonly getSession: (headers: Headers) => Effect.Effect<Session | null, AuthError>;
  readonly validateSession: (token: string) => Effect.Effect<Session, SessionNotFoundError>;
}

// Service tag
class AuthService extends Context.Tag("@gemhog/core/AuthService")<
  AuthService,
  AuthService
>() {}

// Implementation layer
const AuthLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const drizzle = yield* PgDrizzle;
    return {
      getSession: (headers) => Effect.tryPromise({
        try: () => auth.api.getSession({ headers }),
        catch: (error) => new AuthError({ cause: error }),
      }),
      validateSession: (token) => Effect.gen(function* () {
        // Implementation using drizzle
      }),
    };
  })
);
```

### Pattern 2: Layer Composition for Dependencies
**What:** Compose layers to build dependency graph
**When to use:** At application entry point and in tests
**Example:**
```typescript
// Source: https://effect.website/docs/requirements-management/layers/
import { Layer } from "effect";
import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";

// Database layer (no dependencies)
const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
});

// Drizzle layer (depends on PgClient)
const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

// Auth layer (depends on Drizzle)
const AuthLive = AuthServiceLive.pipe(Layer.provide(DrizzleLive));

// Payment layer (depends on nothing external currently)
const PaymentLive = PaymentServiceLive;

// App layer (merges all domain layers)
export const AppLive = Layer.mergeAll(
  DrizzleLive,
  AuthLive,
  PaymentLive,
);
```

### Pattern 3: Tagged Errors for Domain Boundaries
**What:** Use Data.TaggedError for type-safe error handling
**When to use:** All domain errors
**Example:**
```typescript
// Source: https://effect.website/docs/error-management/yieldable-errors/
import { Data, Effect } from "effect";

// Domain error hierarchy
class AuthError extends Data.TaggedError("AuthError")<{
  message: string;
  cause?: unknown;
}> {}

class SessionNotFoundError extends Data.TaggedError("SessionNotFoundError")<{
  token: string;
}> {}

class SessionExpiredError extends Data.TaggedError("SessionExpiredError")<{
  sessionId: string;
  expiredAt: Date;
}> {}

// Usage in service
const validateSession = (token: string) =>
  Effect.gen(function* () {
    const session = yield* findSession(token);
    if (!session) {
      return yield* new SessionNotFoundError({ token });
    }
    if (session.expiresAt < new Date()) {
      return yield* new SessionExpiredError({
        sessionId: session.id,
        expiredAt: session.expiresAt,
      });
    }
    return session;
  });

// Handling errors
program.pipe(
  Effect.catchTags({
    SessionNotFoundError: (e) => Effect.succeed(null),
    SessionExpiredError: (e) => refreshSession(e.sessionId),
  })
);
```

### Anti-Patterns to Avoid
- **Leaking dependencies in service interfaces:** Service methods should return `Effect<A, E, never>`, not `Effect<A, E, SomeDependency>`. Dependencies belong in the Layer, not the service interface.
- **Scattering Effect.provide calls:** Provide dependencies once at app entry point, not throughout codebase.
- **Using Promise directly in Effect code:** Wrap with `Effect.tryPromise` for proper error tracking.
- **Mixing Effect and non-Effect code:** Keep Effect on backend only per project constraints. Frontend continues with existing patterns.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DB connection pooling | Custom pool management | @effect/sql-pg PgClient | Handles pool lifecycle, health checks, timeouts |
| Drizzle + Effect bridge | Manual Effect wrappers | @effect/sql-drizzle | Exposes connection pool to Drizzle properly |
| Test fixtures for Effect | Custom test setup | @effect/vitest it.effect | Provides TestClock, TestRandom, fiber dumps |
| Resource cleanup | Manual try/finally | Layer.scoped, Effect.acquireRelease | Automatic cleanup even on interruption |
| Error discrimination | Manual type guards | Data.TaggedError + catchTags | Compile-time exhaustiveness checking |

**Key insight:** Effect's ecosystem packages handle resource lifecycle (connections, scopes) correctly. Hand-rolling loses interruption safety and proper cleanup ordering.

## Common Pitfalls

### Pitfall 1: Forgetting strict TypeScript mode
**What goes wrong:** Effect types don't infer correctly, missing dependency errors at runtime
**Why it happens:** Effect requires `strict: true` in tsconfig for proper type inference
**How to avoid:** Verify `"strict": true` in tsconfig.json (already set in this codebase)
**Warning signs:** `any` types appearing where Effect types expected

### Pitfall 2: Running Effects incorrectly
**What goes wrong:** Effects never execute or execute multiple times
**Why it happens:** Effects are lazy - they describe computations, not execute them
**How to avoid:** Use `Effect.runPromise` or `Effect.runSync` at boundaries only
**Warning signs:** Functions returning Effect but consumers expecting Promise

### Pitfall 3: Import path confusion during migration
**What goes wrong:** Runtime module resolution failures
**Why it happens:** Old imports (`@gemhog/db`, `@gemhog/auth`) not updated to new paths
**How to avoid:** Update all imports atomically; use TypeScript errors to find missing updates
**Warning signs:** TypeScript compiles but runtime throws "module not found"

### Pitfall 4: Shared layer state between tests
**What goes wrong:** Tests pass individually but fail when run together
**Why it happens:** `it.layer` shares layer instance across test cases by default
**How to avoid:** Create fresh layers per test if state isolation needed, or use `it.effect` with explicit `Effect.provide`
**Warning signs:** Flaky tests that depend on execution order

### Pitfall 5: Mixing Effect and better-auth patterns
**What goes wrong:** Auth flows break or become untestable
**Why it happens:** better-auth uses callback patterns, Effect uses generators
**How to avoid:** Wrap better-auth at boundary with `Effect.tryPromise`, keep auth instance as-is
**Warning signs:** Trying to convert better-auth internals to Effect

## Code Examples

Verified patterns from official sources:

### Database Layer Setup
```typescript
// Source: https://www.typeonce.dev/course/paddle-payments-full-stack-typescript-app/server-implementation/postgres-database-with-effect-and-drizzle
import { Config, Layer } from "effect";
import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";

// PostgreSQL connection layer
const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
});

// Drizzle layer composed on top
const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

// Export combined database layer
export const DatabaseLive = Layer.mergeAll(PgLive, DrizzleLive);
```

### Service with Drizzle Queries
```typescript
// Source: https://www.typeonce.dev/course/paddle-payments-full-stack-typescript-app/server-implementation/postgres-database-with-effect-and-drizzle
import { Effect } from "effect";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import { user } from "./auth.sql";

const findUserById = (id: string) =>
  Effect.gen(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;
    const [found] = yield* drizzle
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return found ?? null;
  });
```

### Testing with Mock Layers
```typescript
// Source: https://effect.website/docs/requirements-management/layers/
import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";

// Mock layer for testing
const AuthServiceTest = Layer.succeed(AuthService, {
  getSession: () => Effect.succeed({ user: { id: "test-user" } }),
  validateSession: () => Effect.succeed({ id: "test-session", userId: "test-user" }),
});

// Test using mock layer
it.effect("validates session correctly", () =>
  Effect.gen(function* () {
    const auth = yield* AuthService;
    const session = yield* auth.validateSession("token");
    expect(session.userId).toBe("test-user");
  }).pipe(Effect.provide(AuthServiceTest))
);
```

### Wrapping better-auth at Boundary
```typescript
// Keep better-auth instance as-is, wrap calls in Effect
import { Effect } from "effect";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// better-auth instance (unchanged from current code)
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // ... rest of config
});

// Effect wrapper for use in services
const getSessionEffect = (headers: Headers) =>
  Effect.tryPromise({
    try: () => auth.api.getSession({ headers }),
    catch: (error) => new AuthError({ message: "Failed to get session", cause: error }),
  });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @effect-ts/core | effect (unified package) | Effect 3.0 (2024) | Single package, simpler imports |
| fp-ts | effect | Effect 3.0 | Effect is successor, better DX |
| Manual pool management | @effect/sql-pg | 2024 | Automatic lifecycle, health checks |
| Custom Drizzle wrappers | @effect/sql-drizzle | 2024 | Official integration |

**Deprecated/outdated:**
- `@effect-ts/core`, `@effect-ts/system`: Legacy packages, use `effect` instead
- `fp-ts` style: Effect has different conventions (e.g., `Effect.gen` vs `pipe` chains)

## Migration Strategy

### Current State Analysis

**packages/db consumers:**
- `packages/auth/src/index.ts` - imports `db` instance and `schema/auth`
- `packages/api/package.json` - declares dependency (not used in code)
- `apps/server/package.json` - declares dependency (not used in code)

**packages/auth consumers:**
- `packages/api/src/context.ts` - imports `auth`
- `apps/server/src/index.ts` - imports `auth`
- `apps/web/package.json` - declares dependency (NOT actually used - uses better-auth/react directly)

### Migration Order

1. Create `packages/core` with new structure
2. Move Drizzle schemas to domain folders (`auth/auth.sql.ts`)
3. Move auth config to `auth/index.ts`
4. Move payments to `payment/index.ts`
5. Add Effect layers (`drizzle/index.ts` with PgLive + DrizzleLive)
6. Update package.json exports for subpath imports
7. Update all consumer imports
8. Delete `packages/db` and `packages/auth`
9. Update root package.json db:* scripts to filter `@gemhog/core`

### Consumer Import Updates

```typescript
// Before
import { db } from "@gemhog/db";
import * as schema from "@gemhog/db/schema/auth";
import { auth } from "@gemhog/auth";

// After
import { db } from "@gemhog/core/drizzle";  // or just "@gemhog/core" for main export
import * as schema from "@gemhog/core/auth/auth.sql";
import { auth } from "@gemhog/core/auth";
```

### Package.json Exports Structure

```json
{
  "name": "@gemhog/core",
  "type": "module",
  "exports": {
    ".": { "default": "./src/drizzle/index.ts" },
    "./drizzle": { "default": "./src/drizzle/index.ts" },
    "./auth": { "default": "./src/auth/index.ts" },
    "./auth/auth.sql": { "default": "./src/auth/auth.sql.ts" },
    "./payment": { "default": "./src/payment/index.ts" }
  }
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Effect + better-auth deep integration**
   - What we know: better-auth works with callbacks and session management
   - What's unclear: Whether to wrap entire auth object or just specific methods
   - Recommendation: Wrap at API boundary only, keep better-auth internals unchanged

2. **@effect/vitest version compatibility**
   - What we know: Requires vitest ^1.6.0, codebase has vitest ^4.0.17
   - What's unclear: Whether @effect/vitest 0.45 supports vitest 4.x
   - Recommendation: Test compatibility during implementation; vitest 4 is major version bump

3. **Layer initialization timing**
   - What we know: PgClient needs DATABASE_URL at construction time
   - What's unclear: How to handle env loading order with Effect Config
   - Recommendation: Use `Config.redacted("DATABASE_URL")` pattern, Effect handles env loading

## Sources

### Primary (HIGH confidence)
- [Effect Documentation - Services](https://effect.website/docs/requirements-management/services/) - Service definition patterns
- [Effect Documentation - Layers](https://effect.website/docs/requirements-management/layers/) - Layer composition patterns
- [Effect Documentation - Yieldable Errors](https://effect.website/docs/error-management/yieldable-errors/) - TaggedError patterns
- [TypeOnce - Drizzle + Effect](https://www.typeonce.dev/course/paddle-payments-full-stack-typescript-app/server-implementation/postgres-database-with-effect-and-drizzle) - Database layer setup

### Secondary (MEDIUM confidence)
- [npm - effect](https://www.npmjs.com/package/effect) - Version 3.19.14, last published 18 days ago
- [npm - @effect/sql-drizzle](https://www.npmjs.com/package/@effect/sql-drizzle) - Version 0.45.0
- [GitHub - Effect-TS/effect vitest README](https://github.com/Effect-TS/effect/blob/main/packages/vitest/README.md) - Testing setup
- [GitHub - PaulJPhilp/EffectPatterns](https://github.com/PaulJPhilp/EffectPatterns) - Community patterns

### Tertiary (LOW confidence)
- [WebSearch - Effect TS patterns 2025](https://www.effect.solutions/services-and-layers) - General patterns
- [WebSearch - package.json exports](https://hirok.io/posts/package-json-exports) - Subpath exports guide

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via npm, official docs
- Architecture: HIGH - Official Effect documentation patterns
- Migration strategy: HIGH - Based on actual codebase analysis
- Pitfalls: MEDIUM - Mix of official docs and community reports

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - Effect ecosystem is stable)
