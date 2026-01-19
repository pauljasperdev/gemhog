# Phase 3: Core Consolidation - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Merge `packages/db` and `packages/auth` into a domain-driven `packages/core` with Effect TS for dependency injection. The core package provides auth and payment domains with typed services using Effect Layers. This is a structural reorganization with Effect adoption — no new features.

</domain>

<decisions>
## Implementation Decisions

### Domain Structure
- Organize by domain at top level: `core/auth/`, `core/payment/`
- Initial domains: auth (includes user-related code), payment
- Each domain contains: `{domain}.sql.ts` (Drizzle schema), `index.ts` (exports business logic + schema)
- Drizzle-specific infrastructure lives in `core/drizzle/` (connection, client, migrations)

### Effect TS Patterns
- Full Effect adoption: services return `Effect<A, E, R>`, all errors typed, Layer for DI
- Error structure: domain-specific errors extend common base types (both tagged and shared)
- Layer strategy: Domain Layers (AuthLayer, PaymentLayer) composed together at app root, separable for testing
- Effect runs backend-only — frontend continues with existing patterns
- Zod validates at API boundary, Effect services receive validated data

### Migration Approach
- Big bang: create `packages/core`, move everything at once, single PR
- Update all imports from `@repo/db`, `@repo/auth` to domain subpaths
- Import style: `@repo/core/auth`, `@repo/core/payment` — explicit domain paths
- Delete `packages/db` and `packages/auth` immediately in same PR

### Testing with Effect
- Unit tests: mock Layers for business logic testing (compile-time safety)
- Integration tests: real Layers against test database (correctness)
- Mock Layers location: `core/auth/auth.mock.ts` alongside domain code
- Test files location: alongside source (`auth.test.ts`, `auth.int.test.ts`)
- Integration setup: runs via `pnpm test:integration` script, no standalone setup file
- Additional infra setup (if needed) goes in package.json scripts

### Claude's Discretion
- Exact Effect error types hierarchy
- Internal service composition patterns
- Migration order of files within each domain
- Drizzle configuration structure

</decisions>

<specifics>
## Specific Ideas

- User files live within auth domain (auth handles authentication + user management)
- Stock code doesn't exist yet — not a domain for this phase
- No `test/integration-setup.ts` — if references exist, delete them

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-core-consolidation*
*Context gathered: 2026-01-19*
