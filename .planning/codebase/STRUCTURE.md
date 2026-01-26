# Codebase Structure

**Updated:** 2026-01-26

## Directory Layout

```
gemhog/
├── apps/                    # Deployable applications
│   ├── server/             # Hono backend (streaming/long-running)
│   │   ├── src/
│   │   │   └── serve.ts    # Server entry point
│   │   ├── tsdown.config.ts
│   │   ├── .env            # Server environment
│   │   └── package.json
│   └── web/                # Next.js frontend application
│       ├── src/
│       │   ├── app/        # Next.js App Router pages
│       │   ├── components/ # React components
│       │   ├── lib/        # Utility functions
│       │   ├── server/     # Next server helpers (auth wrappers)
│       │   └── trpc/       # tRPC client setup (TanStack Query)
│       ├── tests/e2e/      # Playwright E2E tests
│       ├── next.config.ts
│       └── package.json
├── packages/               # Shared internal libraries
│   ├── api/               # tRPC router definitions
│   ├── core/              # Domain-driven core (auth, drizzle)
│   ├── env/               # Environment validation
│   └── config/            # Shared TypeScript config
├── .planning/             # Planning documents (GSD)
├── scripts/               # Build and verification scripts
├── vitest.config.ts       # Unit test configuration
├── vitest.integration.config.ts  # Integration test configuration
├── playwright.config.ts   # E2E test configuration
├── pnpm-workspace.yaml    # Workspace configuration
├── biome.json            # Linting & formatting
├── lefthook.yml          # Pre-commit hooks
├── tsconfig.json         # Root TypeScript config
└── package.json          # Root workspace package
```

## Directory Purposes

**apps/server/**

- Purpose: Backend for streaming/long-running work
- Contains: Hono routes, AI endpoint
- Key files: `src/serve.ts` (entry point), `src/app.ts` (Hono app)
- Subdirectories: `src/` only

**apps/web/**

- Purpose: Next.js frontend application
- Contains: React pages, components, Next API routes, utilities
- Key files: `src/app/layout.tsx` (root layout)
- Subdirectories:
  - `src/app/` - Next.js App Router pages + API routes
  - `src/components/` - React components
  - `src/components/ui/` - shadcn/ui primitives
  - `src/lib/` - Utility functions
  - `src/server/` - Next server helpers
  - `src/trpc/` - tRPC client setup
  - `tests/e2e/` - Playwright E2E tests

**packages/api/**

- Purpose: tRPC API layer
- Contains: Router definitions, procedures, context
- Key files: `src/index.ts` (tRPC init), `src/routers/index.ts` (appRouter)
- Subdirectories: `src/routers/`

**packages/core/**

- Purpose: Domain-driven core package (consolidated from db + auth)
- Contains: Database layer, auth domain
- Key files:
  - `src/drizzle/index.ts` - Database client and Effect layers
  - `src/auth/index.ts` - Better-Auth config and helpers
- Subdirectories:
  - `src/drizzle/` - Database connection, client
  - `src/auth/` - Auth domain (service, schema, errors, mocks)
  - `src/migrations/` - Database migration files

**packages/env/**

- Purpose: Environment configuration
- Contains: t3-env validated env schemas for server and web
- Key files: `src/server.ts`, `src/web.ts`
- Subdirectories: None

## Key File Locations

**Entry Points:**

- `apps/server/src/serve.ts` - Backend server entry
- `apps/web/src/app/layout.tsx` - Frontend root layout

**Configuration:**

- `tsconfig.json` - Root TypeScript config
- `biome.json` - Linting and formatting
- `pnpm-workspace.yaml` - Workspace and catalog
- `packages/core/drizzle.config.ts` - Database migrations
- `apps/web/next.config.ts` - Next.js config

**Core Logic:**

- `packages/api/src/routers/index.ts` - tRPC routes
- `apps/web/src/app/api/trpc/[trpc]/route.ts` - Next tRPC handler
- `apps/web/src/app/api/auth/[...all]/route.ts` - Next Better Auth handler
- `apps/web/src/trpc/client.ts` - tRPC client (TanStack Query)
- `packages/core/src/auth/index.ts` - Auth configuration
- `packages/core/src/auth/auth.sql.ts` - Auth database schema
- `packages/core/src/drizzle/client.ts` - Database client
- `packages/env/src/server.ts` - Server env validation

**Testing:**

- Co-located tests: `*.test.ts` alongside source files
- Integration tests: `*.int.test.ts` (requires Docker Postgres)
- E2E tests: `apps/web/tests/e2e/*.e2e.test.ts`

**Documentation:**

- `README.md` - Project overview and setup

## Development Scripts

**Root package.json scripts:**

| Script        | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `setup`       | Re-install dependencies and install Playwright deps |
| `dev`         | Run all apps in development mode                    |
| `dev:web`     | Run Next.js frontend only                           |
| `dev:server`  | Run Hono backend only                               |
| `build`       | Build all packages                                  |
| `check`       | Biome lint + format + auto-fix + TypeScript types   |
| `test`        | Full test pipeline (static + unit + integration + e2e + audit) |
| `test:audit`  | Run pnpm audit for dependency vulnerabilities       |
| `db:start`    | Start local PostgreSQL via Docker                   |
| `db:stop`     | Stop PostgreSQL container                            |
| `db:push`     | Push schema changes to database                      |
| `db:generate` | Generate Drizzle migrations                          |
| `db:migrate`  | Run Drizzle migrations                               |
| `db:studio`   | Open Drizzle Studio                                  |

## Naming Conventions

**Files:**

- `kebab-case.tsx` - React components (`user-menu.tsx`, `sign-in-form.tsx`)
- `kebab-case.ts` - TypeScript modules (`trpc/client.ts`)
- `index.ts` - Barrel exports for packages

**Directories:**

- `kebab-case` - All directories (lowercase with hyphens)
- `ui/` - UI primitives directory

**Special Patterns:**

- `page.tsx` - Next.js page component
- `layout.tsx` - Next.js layout component
- `*.config.ts` - Configuration files

## Where to Add New Code

**New Feature:**

- Primary code: `apps/web/src/app/[feature]/` (pages)
- Components: `apps/web/src/components/`
- API routes: `packages/api/src/routers/`
- Config if needed: `packages/env/src/`

**New Component:**

- Implementation: `apps/web/src/components/[name].tsx`
- UI primitives: `apps/web/src/components/ui/`
- Types: Inline or `packages/api/src/`

**New API Procedure:**

- Definition: `packages/api/src/routers/index.ts`
- Or new router file: `packages/api/src/routers/[name].ts`

**New Domain (in packages/core):**

- Create folder: `packages/core/src/[domain]/`
- Schema file: `packages/core/src/[domain]/[domain].sql.ts`
- Service file: `packages/core/src/[domain]/[domain].service.ts`
- Errors file: `packages/core/src/[domain]/[domain].errors.ts`
- Mock file: `packages/core/src/[domain]/[domain].mock.ts`
- Index: `packages/core/src/[domain]/index.ts`
- Export from: `packages/core/package.json` exports field

**New Database Table:**

- Schema: `packages/core/src/[domain]/[domain].sql.ts`
- Follow `*.sql.ts` naming convention for Drizzle schema files
- Aggregate in: `packages/core/src/drizzle/index.ts`

**Utilities:**

- Shared helpers: `apps/web/src/lib/`
- Type definitions: Package-local or `packages/api/`

## Special Directories

**.planning/**

- Purpose: GSD planning documents
- Source: Created by planning workflows
- Committed: Yes

**packages/config/**

- Purpose: Shared TypeScript configuration
- Contains: `tsconfig.base.json`
- Committed: Yes

**scripts/**

- Purpose: Build and verification scripts
- Contains: `test.sh` (full test pipeline)
- Committed: Yes

**node_modules/**

- Purpose: Installed dependencies (per-workspace)
- Source: Auto-generated by pnpm
- Committed: No (gitignored)

## Domain-Driven Structure (packages/core)

The `packages/core` package uses a domain-driven structure that consolidates
database and business logic. This avoids cyclic dependencies by colocating
schemas with their domain services.

**Current Structure:**

```
packages/core/
├── src/
│   ├── drizzle/           # Database layer
│   │   ├── client.ts      # Drizzle client instance
│   │   ├── index.ts       # Effect layers (DatabaseLive)
│   │   ├── connection.int.test.ts  # Effect layer integration tests
│   │   └── migrations.int.test.ts  # Migration verification tests
│   ├── auth/              # Auth domain
│   │   ├── auth.sql.ts      # Drizzle schema (user, session, account, verification)
│   │   ├── auth.service.ts  # Better Auth config
│   │   ├── auth.errors.ts   # Domain errors (TaggedError)
│   │   ├── auth.mock.ts     # Mock layer for testing
│   │   ├── auth.test.ts     # Unit tests
│   │   ├── auth.int.test.ts # Integration tests (better-auth API)
│   │   ├── schema.int.test.ts # Schema CRUD integration tests
│   │   ├── test-fixtures.ts # Test utilities (truncation, factories)
│   │   └── index.ts         # Exports + Better-Auth config
│   └── migrations/        # Database migrations
│       ├── 0000_initial_schema.sql
│       └── meta/_journal.json
├── drizzle.config.ts      # Schema glob: ./src/*/*.sql.ts
└── package.json
```

**Key Patterns:**

- `*.sql.ts` naming for Drizzle schema files (not `*.schema.ts`)
- Domain folders directly under `src/` (drizzle/, auth/)
- Direct Better Auth instance in core
- Co-located tests with `.test.ts` suffix

**Export Paths:**

| Import                       | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `@gemhog/core`               | DB instance (main export)          |
| `@gemhog/core/drizzle`       | DB instance (explicit)             |
| `@gemhog/core/auth`          | Auth instance + Better-Auth config |
| `@gemhog/core/auth/auth.sql` | Raw schema tables                  |

**Adding a New Domain:**

1. Create folder: `packages/core/src/[domain]/`
2. Add schema: `[domain].sql.ts` (Drizzle tables)
3. Add service: `[domain].service.ts` (Effect service + layer)
4. Add errors: `[domain].errors.ts` (TaggedErrors)
5. Add mock: `[domain].mock.ts` (test layer)
6. Add fixtures: `test-fixtures.ts` (truncation, factories for tests)
7. Add index: `index.ts` (exports)
8. Register export in `package.json` exports field

**Reference:** Pattern based on
[terminal.shop](https://github.com/terminaldotshop/terminal) and
[immo](https://github.com/pauljasperdev/immo) repos.

---

_Updated: 2026-01-22_
