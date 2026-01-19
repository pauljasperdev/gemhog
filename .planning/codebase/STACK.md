# Technology Stack

**Analysis Date:** 2026-01-15

## Languages

**Primary:**

- TypeScript 5.9.3 - All application code (`package.json`)

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
- Hono 4.11.4 - Backend HTTP framework (`apps/server/package.json`)
- React 19.2.3 - UI library (`apps/web/package.json`)

**Testing (Planned):**

- Vitest - Unit testing (not yet configured)
- Playwright MCP - E2E verification (not yet configured)

**Build/Dev:**

- tsdown 0.16.5 - TypeScript build tool (`apps/server/package.json`)
- tsx 4.19.2 - TypeScript execution (`apps/server/package.json`)
- Babel React Compiler 1.0.0 - React optimization (`apps/web/package.json`)

## Key Dependencies

**Critical:**

- tRPC 11.8.1 - End-to-end type-safe API (`packages/api/`, `apps/web/`,
  `apps/server/`)
- better-auth 1.4.12 - Authentication framework (`packages/auth/`)
- Drizzle ORM 0.45.1 - TypeScript-first ORM (`packages/db/`)
- ai 6.0.34 - Vercel AI SDK (`apps/web/`, `apps/server/`)
- @ai-sdk/google 3.0.8 - Google Gemini integration (`apps/server/`)

**Infrastructure:**

- pg 8.16.3 - PostgreSQL driver (`packages/db/`)
- @tanstack/react-query 5.90.12 - Data fetching & caching (`apps/web/`)
- Zod 4.3.5 - Schema validation (all packages via catalog)

**UI:**

- TailwindCSS 4.1.10 - Styling (`apps/web/`)
- shadcn/ui 3.6.2 - Component library (`apps/web/`)
- Lucide React 0.546.0 - Icons (`apps/web/`)
- Sonner 2.0.5 - Toast notifications (`apps/web/`)

**Payment:**

- @polar-sh/sdk - Polar payment SDK (`packages/auth/`)
- @polar-sh/better-auth 1.6.4 - Better Auth Polar plugin (`packages/auth/`,
  `apps/web/`)

## Configuration

**Environment:**

- t3-oss/env-core 0.13.1 - Environment validation (`packages/env/`)
- Zod schemas for type-safe env vars
- Server: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `POLAR_ACCESS_TOKEN`,
  `CORS_ORIGIN`
- Client: `NEXT_PUBLIC_SERVER_URL`

**Build:**

- `tsconfig.json` - TypeScript config (extends
  `@gemhog/config/tsconfig.base.json`)
- `biome.json` - Linting and formatting
- `drizzle.config.ts` - Database migrations (`packages/db/`)
- `next.config.ts` - Next.js configuration (`apps/web/`)

## Platform Requirements

**Development:**

- Any platform with Node.js
- PostgreSQL (via Docker or local) - `packages/db/docker-compose.yml`
- pnpm for package management

**Production:**

- SST v3 on AWS - Infrastructure-as-code deployment
- SST-agnostic app code (reads env vars only, no SST SDK imports)
- PostgreSQL database
- Test stage for external AWS resources (S3, etc.) during development

---

_Stack analysis: 2026-01-15_ _Update after major dependency changes_
