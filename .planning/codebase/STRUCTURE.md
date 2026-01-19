# Codebase Structure

**Analysis Date:** 2026-01-15

## Directory Layout

```
gemhog/
├── apps/                    # Deployable applications
│   ├── server/             # Hono backend API server
│   │   ├── src/
│   │   │   └── index.ts    # Server entry point
│   │   ├── tsdown.config.ts
│   │   ├── .env            # Server environment
│   │   └── package.json
│   └── web/                # Next.js frontend application
│       ├── src/
│       │   ├── app/        # Next.js App Router pages
│       │   ├── components/ # React components
│       │   ├── lib/        # Utility functions
│       │   └── utils/      # Helper utilities
│       ├── next.config.ts
│       └── package.json
├── packages/               # Shared internal libraries
│   ├── api/               # tRPC router definitions
│   ├── auth/              # Authentication configuration
│   ├── db/                # Database schema & ORM
│   ├── env/               # Environment validation
│   └── config/            # Shared TypeScript config
├── .planning/             # Planning documents (GSD)
├── pnpm-workspace.yaml    # Workspace configuration
├── biome.json            # Linting & formatting
├── tsconfig.json         # Root TypeScript config
└── package.json          # Root workspace package
```

## Directory Purposes

**apps/server/**

- Purpose: Backend API server
- Contains: Hono routes, tRPC handlers, AI endpoint
- Key files: `src/index.ts` (entry point)
- Subdirectories: `src/` only

**apps/web/**

- Purpose: Next.js frontend application
- Contains: React pages, components, utilities
- Key files: `src/app/layout.tsx` (root layout)
- Subdirectories:
  - `src/app/` - Next.js App Router pages
  - `src/components/` - React components
  - `src/components/ui/` - shadcn/ui primitives
  - `src/lib/` - Utility functions
  - `src/utils/` - Helper utilities

**packages/api/**

- Purpose: tRPC API layer
- Contains: Router definitions, procedures, context
- Key files: `src/index.ts` (tRPC init), `src/routers/index.ts` (appRouter)
- Subdirectories: `src/routers/`

**packages/auth/**

- Purpose: Authentication configuration
- Contains: Better-Auth setup, Polar integration
- Key files: `src/index.ts` (auth config), `src/lib/payments.ts` (Polar client)
- Subdirectories: `src/lib/`

**packages/db/**

- Purpose: Database layer
- Contains: Drizzle schema, ORM instance
- Key files: `src/index.ts` (db instance), `src/schema/auth.ts` (auth tables)
- Subdirectories: `src/schema/`

**packages/env/**

- Purpose: Environment configuration
- Contains: Zod-validated env schemas for different targets
- Key files: `src/server.ts`, `src/web.ts`, `src/native.ts`
- Subdirectories: None

## Key File Locations

**Entry Points:**

- `apps/server/src/index.ts` - Backend server entry
- `apps/web/src/app/layout.tsx` - Frontend root layout

**Configuration:**

- `tsconfig.json` - Root TypeScript config
- `biome.json` - Linting and formatting
- `pnpm-workspace.yaml` - Workspace and catalog
- `packages/db/drizzle.config.ts` - Database migrations
- `apps/web/next.config.ts` - Next.js config

**Core Logic:**

- `packages/api/src/routers/index.ts` - tRPC routes
- `packages/auth/src/index.ts` - Auth configuration
- `packages/db/src/schema/auth.ts` - Database schema
- `packages/env/src/server.ts` - Server env validation

**Testing:**

- Not yet configured
- Planned: Co-located tests (`*.test.ts` alongside source)
- Planned: Integration tests using Local Postgres Docker + Test stage AWS resources

**Documentation:**

- `README.md` - Project overview and setup

## Development Scripts

**Root package.json scripts:**

| Script     | Purpose                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `dev:init` | Re-install dependencies and start database. Use when to fetch correct native binaries and start database. |
| `dev`      | Run all apps in development mode                                                                          |
| `db:start` | Start local PostgreSQL via Docker                                                                         |
| `db:push`  | Push schema changes to database                                                                           |
| `check`    | Run Biome linting and formatting                                                                          |

## Naming Conventions

**Files:**

- `kebab-case.tsx` - React components (`user-menu.tsx`, `sign-in-form.tsx`)
- `kebab-case.ts` - TypeScript modules (`auth-client.ts`)
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

**New Database Table:**

- Schema: `packages/db/src/schema/[name].ts`
- Export from: `packages/db/src/schema/index.ts`

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

**node_modules/**

- Purpose: Installed dependencies (per-workspace)
- Source: Auto-generated by pnpm
- Committed: No (gitignored)

## Planned Structural Changes

**Consolidate into packages/core (Domain-Driven):**

Merge `packages/db` and `packages/auth` into a single `packages/core` package with domain-driven structure. This avoids cyclic dependencies (db needs schemas, domains need db connection) by colocating everything in one package.

**Current Structure:**

```
packages/
  db/                    # Database connection + schemas
    src/
      index.ts           # Drizzle connection
      schema/
        auth.ts          # Auth tables
        index.ts         # Barrel export
  auth/                  # Better-auth config
    src/
      index.ts           # Auth config (imports from @gemhog/db)
      lib/payments.ts    # Polar client
```

**Target Structure:**

```
packages/
  core/
    src/
      drizzle/
        index.ts         # DB connection, aggregates schemas via spread
      auth/
        auth.sql.ts      # Tables: user, session, account, verification
        index.ts         # Better-auth config + Polar
        payments.ts      # Polar client
      # Future domains:
      stock/
        stock.sql.ts
        index.ts
      thesis/
        thesis.sql.ts
        index.ts
    docker-compose.yml
    drizzle.config.ts    # Schema glob: ./src/*/*.sql.ts
    package.json
```

**Key Patterns:**

- `*.sql.ts` naming for Drizzle schema files (not `*.schema.ts`)
- Domain folders directly under `src/` (auth/, stock/, thesis/)
- `drizzle/index.ts` aggregates schemas: `{ ...authSchema, ...stockSchema }`
- No cyclic deps: auth imports from sibling `../drizzle`, not external package

**Export Paths:**
| Import | Purpose |
|--------|---------|
| `@gemhog/core` | DB instance (main export) |
| `@gemhog/core/drizzle` | DB instance (explicit) |
| `@gemhog/core/auth` | Auth instance |
| `@gemhog/core/auth/auth.sql` | Raw schema tables |

**Consumer Updates Required:**

- `packages/api`: `@gemhog/auth` → `@gemhog/core/auth`
- `apps/server`: `@gemhog/auth` → `@gemhog/core/auth`
- `apps/web`: `@gemhog/auth` → `@gemhog/core`
- Root `package.json`: db:\* scripts filter `@gemhog/core`

**Reference:** Pattern based on [terminal.shop](https://github.com/terminaldotshop/terminal) and [immo](https://github.com/pauljasperdev/immo) repos.

---

_Structure analysis: 2026-01-15_
_Updated: 2026-01-19 — added core package consolidation plan_
_Update when directory structure changes_
