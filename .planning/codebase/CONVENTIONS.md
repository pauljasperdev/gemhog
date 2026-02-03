# Coding Conventions

**Analysis Date:** 2026-01-15

## Naming Patterns

**Files:**

- `kebab-case.tsx` for React components (`user-menu.tsx`, `sign-in-form.tsx`)
- `kebab-case.ts` for TypeScript modules (`auth-client.ts`)
- `index.ts` for barrel exports in packages

**Functions:**

- camelCase for all functions (`createContext`, `getSession`)
- No special prefix for async functions
- `handle*` pattern for event handlers where applicable

**Variables:**

- camelCase for variables (`queryClient`, `authClient`)
- camelCase for constants (`links` as const array)
- No underscore prefix for private members

**Types:**

- PascalCase for interfaces, no I prefix (`Context`, `Session`)
- PascalCase for type aliases
- Explicit `import type` for type-only imports

## Code Style

**Formatting:**

- Biome formatter for code (`biome.json`)
- Prettier for markdown files (`.prettierrc`)
- Indentation: 2 spaces
- Quotes: Double quotes
- Semicolons: Enforced (Biome default)

**Commands:**

- `pnpm check` — Format and lint JS/TS/JSON/CSS (Biome)
- `pnpm format:md` — Format markdown files (Prettier)

**Linting:**

- Biome linter with recommended rules
- `useSelfClosingElements: error`
- `useSingleVarDeclarator: error`
- `useDefaultParameterLast: error`
- `noUnusedTemplateLiteral: error`
- `noInferrableTypes: error`

## Import Organization

**Order:**

1. External packages (`hono`, `@trpc/server`, `react`)
2. Internal packages (`@gemhog/api`, `@gemhog/auth`)
3. Relative imports (`./`, `../`)
4. Type imports (using `import type`)

**Grouping:**

- Blank line between groups
- Alphabetical within groups (Biome enforced)

**Path Aliases:**

- `@/` → `apps/web/src/`
- `@gemhog/*` → workspace packages

## Environment Access

- Use `Config.string()` inside Effect services and utilities instead of
  importing `serverEnv` directly.
- Local defaults are hydrated into `process.env` when `LOCAL_ENV=1` in
  `packages/env/src/server.ts` and `packages/env/src/client.ts`, so
  `Config.string()` works consistently across runtime and tests.

## Effect Service Abstraction

Use a consistent service + layer pattern when refactoring to Effect:

```typescript
import { Context, Effect, Layer } from "effect";

class Service extends Context.Tag("Service")<
  Service,
  {
    readonly run: () => Effect.Effect<void>;
  }
>() {}

const ServiceLive = Layer.effect(
  Service,
  Effect.gen(function* () {
    return { run: () => Effect.void };
  }),
);

const AppLive = ServiceLive;

const program = Effect.gen(function* () {
  const service = yield* Service;
  yield* service.run();
});

Effect.runPromise(program.pipe(Effect.provide(AppLive)));
```

**Patterns to follow:**

- Define service interfaces with `Context.Tag`.
- Implement live layers with `Layer.effect` and `Effect.gen` (pull dependencies
  via `yield*`).
- Compose multi-service layers with `Layer.mergeAll` and `Layer.provide`.
- Provide the composed layer stack at call sites (see
  `packages/api/src/routers/subscriber.ts` +
  `packages/core/src/email/email-layers.ts`).

## Error Handling

**Patterns:**

- Throw errors at boundaries
- TRPCError for API errors with codes (`packages/api/src/index.ts`)
- Error callbacks for auth operations (`onError` callback pattern)

**Error Types:**

- `TRPCError` with `code` field (UNAUTHORIZED, etc.)
- Native `Error` for general cases

**Async:**

- Use try/catch for async operations
- Error toasts via Sonner for user feedback

## Logging

**Framework:**

- `console.log` for development
- Hono logger middleware for requests

**Patterns:**

- Server startup logging (`apps/server/src/serve.ts`)
- Debug logging in development (to be removed for production)

**Where:**

- Log at server boundaries
- Avoid logging in utility functions

## Comments

### When to Comment

**Default:** Self-documenting code. Comments only when they add necessary
context (why, risks, or non-obvious behavior).

**DO comment:**

- Non-obvious business logic (explain the WHY)
- Complex algorithms (explain the approach)
- Security-critical code (explain the threat model)
- Workarounds for external bugs (link to issue)

**DON'T comment:**

- Self-explanatory code
- What the code does (the code shows that)
- Historical references (use git history)

### Comment Quality Standards

**Explain WHY, not WHAT:**

```typescript
// BAD: Restates the code
// Validate input
const result = schema.parse(input);

// GOOD: Explains the purpose
// Prevent injection attacks - user input must match expected schema
const result = schema.parse(input);
```

**Avoid archaeological comments:**

Archaeological comments reference historical context rather than explaining
current purpose. They become stale and confusing.

```typescript
// BAD: References past tickets/fixes
// SEC-001 fix
// Removed in refactor #123
// TODO: cleanup after v2 migration

// GOOD: Explains current purpose (or remove if self-explanatory)
// Rate limiting prevents abuse of expensive AI operations
```

**Link to issues for workarounds:**

```typescript
// BAD: Unexplained workaround
// @ts-ignore - doesn't work without this

// GOOD: Links to context
// Workaround for Next.js hydration bug: https://github.com/vercel/next.js/issues/12345
// @ts-ignore - server/client mismatch in dev mode only
```

### JSDoc/TSDoc

Not widely used in this codebase. Self-documenting code with TypeScript types is
preferred. Use JSDoc only for:

- Public library APIs
- Complex function signatures that benefit from inline documentation

## Function Design

**Size:**

- Keep functions focused and small
- Extract helpers for complex logic

**Parameters:**

- Use destructuring for options objects
- Type props inline or via separate interface

**Return Values:**

- Explicit returns preferred
- Return early for guard clauses

## Module Design

**Exports:**

- Named exports preferred for utilities
- Default exports for React components
- Re-export from `index.ts` for public API

**Barrel Files:**

- `packages/*/src/index.ts` for package exports
- `packages/core/src/[domain]/index.ts` for domain re-exports

**React Components:**

```typescript
// Default export pattern (components)
export default function Header() { ... }

// Named export pattern (utilities)
export function ModeToggle() { ... }
```

**UI Components (shadcn/ui pattern):**

```typescript
// apps/web/src/components/ui/input.tsx
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      className={cn("...", className)}
      {...props}
    />
  );
}
export { Input };
```

**Skills for UI work:**

- `/frontend-design` — Use when creating web components, pages, dashboards, or
  React components with high design quality
- `/vercel-react-best-practices` — Use when writing, reviewing, or refactoring
  React/Next.js code for optimal performance patterns
- `/web-design-guidelines` — Use when reviewing UI code for accessibility,
  design best practices, or UX audit
- `/copywriting` — Use when writing or improving marketing copy for homepage,
  landing pages, pricing pages, feature pages, or CTAs

**Skills for backend work:**

- `/effect-ts` — Use when building Effect applications, services, layers, or MCP
  servers. Covers correct APIs, common misconceptions, and patterns.
- `/better-auth-best-practices` — Use when implementing or modifying
  authentication features

**Skills for agent workflow:**

- `/find-skills` — Use when users ask how to do X, want to find a skill, or need
  suggestions for extending capabilities

**tRPC Procedures:**

```typescript
// packages/api/src/index.ts
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

## Effect-TS

Effect guidance lives in the `/effect-ts` skill to avoid duplicate or drifting
standards. Use it for all Effect work (services, layers, handlers, tests, and
observability). If a local rule is needed, document it in the codebase where the
pattern lives, not here.

---

## TanStack Query + tRPC

### Integration Pattern

The app uses `createTRPCOptionsProxy` to bridge tRPC with TanStack Query v5.
This gives type-safe access to `queryOptions()`, `mutationOptions()`,
`queryKey()`, and `mutationKey()` without custom hooks:

```typescript
import { trpc } from "@/trpc/client";

// Queries — pass to useSuspenseQuery / useQuery
const opts = trpc.items.list.queryOptions();

// Mutations — spread into useMutation
const mutation = useMutation(trpc.items.create.mutationOptions());

// Keys — for invalidation and mutation state filters
trpc.items.list.queryKey();
trpc.items.create.mutationKey();
```

### Mutation Pattern

Every mutation that changes server state visible in a query should invalidate
related queries in `onSettled` (runs on both success and error):

```tsx
const addItem = useMutation({
  ...trpc.items.create.mutationOptions(),
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: trpc.items.list.queryKey() });
  },
});
```

### Optimistic Updates

Choose the right approach based on the mutation type:

| Approach                     | When to use                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| UI-based (via `variables`)   | Adding items to lists, simple toggles — show pending items at reduced opacity         |
| Cache-based (via `onMutate`) | Editing existing items inline, reordering — need immediate cache update with rollback |
| None (loading state only)    | Fire-and-forget actions (signup, send email, logout)                                  |

**UI-based (recommended for new items)** — no cache manipulation, pending items
rendered from mutation state:

```tsx
const addTodo = useMutation({
  ...trpc.todos.create.mutationOptions(),
  onSettled: () =>
    queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() }),
});

// In component: render pending items alongside query data
const pendingTodos = useMutationState({
  filters: {
    mutationKey: trpc.todos.create.mutationKey(),
    status: "pending",
  },
  select: (m) => m.state.variables as CreateTodoInput,
});
```

**Cache-based (for in-place edits)** — update cache immediately, rollback on
error:

```tsx
const updateTodo = useMutation({
  ...trpc.todos.update.mutationOptions(),
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: trpc.todos.list.queryKey() });
    const previous = queryClient.getQueryData(trpc.todos.list.queryKey());
    queryClient.setQueryData(trpc.todos.list.queryKey(), (old) =>
      old?.map((t) => (t.id === newTodo.id ? { ...t, ...newTodo } : t)),
    );
    return { previous };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(trpc.todos.list.queryKey(), context?.previous);
  },
  onSettled: () =>
    queryClient.invalidateQueries({ queryKey: trpc.todos.list.queryKey() }),
});
```

### When to Extract to a Hook

Extract mutation logic into a custom hook when:

- The mutation + optimistic update exceeds ~15 lines
- The same mutation is reused across multiple components

Place hooks in `apps/web/src/hooks/use-<name>.ts`.

---

## Deferred Improvements

Items identified during code review that are deferred to future phases:

### Database ID Strategy (Code Review Item 18)

**Current:** UUIDs as primary keys
(`text("id").$defaultFn(() => crypto.randomUUID())`). **Proposed:** `bigserial`
primary key with `nanoid` public_id column for fast lookups and no internal ID
exposure. **Why deferred:** Requires migration of existing data, schema changes
across all tables, and updates to all code referencing `id` fields. Better done
as a dedicated schema migration phase when there are more tables and the pattern
is established project-wide. **When to implement:** Before public beta launch,
as part of a dedicated database schema hardening phase.

### Test File Organization (Code Review Item 19) — IMPLEMENTED

Test files now live in `__tests__/` subfolders within each directory, preserving
colocation while visually separating test code from implementation. All test and
fixture files use the `__tests__/` convention project-wide. Vitest glob patterns
already match `__tests__/` subdirectories via `**`.

---

_Convention analysis: 2026-01-15_ _Update when patterns change_
