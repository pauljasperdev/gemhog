# Technology Stack

**Updated:** 2026-01-22

## Languages

**Primary:**

- TypeScript ^5 - All application code (via `pnpm-workspace.yaml` catalog)

**Secondary:**

- JavaScript - Build scripts, config files

## Runtime

**Environment:**

- Node.js (runtime for server and build tools)
- Bun (optional compilation target) - `apps/server/package.json`

**Package Manager:**

- pnpm 10.15.1 (workspace manager) - `package.json`
- Lockfile: `pnpm-lock.yaml` present
- Workspace catalog: `pnpm-workspace.yaml`

## Frameworks

**Core:**

- Next.js 16.1.1 - Frontend framework (`apps/web/package.json`)
- Hono 4.8.2 - Backend HTTP framework (`apps/server/package.json`)
- React 19.2.3 - UI library (`apps/web/package.json`)

**Testing:**

- Vitest 4.0.17 - Unit and integration testing (`vitest.config.ts`)
- Playwright 1.57.0 - E2E testing (`playwright.config.ts`)

**Build/Dev:**

- tsdown 0.16.5 - TypeScript build tool (`apps/server/package.json`)
- tsx 4.19.2 - TypeScript execution (`apps/server/package.json`)
- Babel React Compiler 1.0.0 - React optimization (`apps/web/package.json`)
- Biome 2.2.0 - Linting and formatting

## Key Dependencies

**Critical:**

- tRPC 11.7.2 - End-to-end type-safe API (`packages/api/`, `apps/web/`,
  `apps/server/`)
- better-auth 1.4.9 - Authentication framework (`packages/core/auth/`)
- Drizzle ORM 0.45.1 - TypeScript-first ORM (`packages/core/drizzle/`)
- ai 6.0.3 - Vercel AI SDK (`apps/web/`, `apps/server/`)
- @ai-sdk/google 3.0.1 - Google Gemini integration (`apps/server/`)

**Effect TS:**

- effect 3.19 - Functional effect system (`packages/core/`)
- @effect/sql 0.49 - SQL abstraction layer
- @effect/sql-pg 0.50 - PostgreSQL Effect integration
- @effect/sql-drizzle 0.48 - Drizzle ORM Effect integration

**Infrastructure:**

- pg 8.16.3 - PostgreSQL driver (`packages/core/`)
- @tanstack/react-query 5.90.12 - Data fetching & caching (`apps/web/`)
- Zod 4.1.13 - Schema validation (all packages via catalog)

**UI:**

- TailwindCSS 4.1.10 - Styling (`apps/web/`)
- shadcn/ui 3.6.2 - Component library (`apps/web/`)
- Lucide React 0.546.0 - Icons (`apps/web/`)
- Sonner 2.0.5 - Toast notifications (`apps/web/`)

## Configuration

**Environment:**

- @t3-oss/env-core 0.13.10 - Server env validation (`packages/env/`)
- @t3-oss/env-nextjs 0.13.10 - Web env validation with Next.js support
  (`packages/env/`)
- Zod schemas for type-safe env vars
- Server: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`,
  `NODE_ENV`
- Client: `NEXT_PUBLIC_SERVER_URL`

**Build:**

- `tsconfig.json` - TypeScript config (extends
  `@gemhog/config/tsconfig.base.json`)
- `biome.json` - Linting and formatting
- `drizzle.config.ts` - Database migrations (`packages/core/`)
- `next.config.ts` - Next.js configuration (`apps/web/`)

## Platform Requirements

**Development:**

- Any platform with Node.js
- PostgreSQL (via Docker or local) - `packages/core/docker-compose.yml`
- pnpm for package management

**Production:**

- SST v3 on AWS - Infrastructure-as-code deployment
- SST-agnostic app code (reads env vars only, no SST SDK imports)
- PostgreSQL database
- Test stage for external AWS resources (S3, etc.) during development

---

_Updated: 2026-01-22_
