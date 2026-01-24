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

- Server startup logging (`apps/server/src/index.ts`)
- Debug logging in development (to be removed for production)

**Where:**

- Log at server boundaries
- Avoid logging in utility functions

## Comments

### When to Comment

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
- `packages/db/src/schema/index.ts` for schema re-exports

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
- `/web-design-guidelines` — Use when reviewing UI code for accessibility,
  design best practices, or UX audit
- `/copywriting` — Use when writing or improving marketing copy for homepage,
  landing pages, pricing pages, feature pages, or CTAs

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

## Effect-TS Patterns

### Pattern Simplification

**Prefer simple patterns over complex ones:**

```typescript
// GOOD: Simple patterns
Effect.succeed(value); // For static values
Effect.void; // For void operations
Effect.map(fn); // For simple transformations
Effect.flatMap(fn); // For sequential operations
Effect.all({ a, b, c }); // For parallel operations

// BAD: Over-engineered
Effect.gen(function* (_) {
  return value; // Unnecessary generator for static value
});
```

**When to use Effect.gen:**

- Complex control flow with conditionals and loops
- Multiple interdependent operations where later ops depend on earlier results
- Imperative style significantly improves readability

```typescript
// GOOD: Complex flow justifies Effect.gen
Effect.gen(function* (_) {
  const user = yield* _(getUser());
  if (user.role === "admin") {
    const permissions = yield* _(getAdminPermissions());
    return { user, permissions };
  }
  return { user, permissions: [] };
});

// BAD: Simple chain doesn't need Effect.gen
Effect.gen(function* (_) {
  const a = yield* _(effectA);
  const b = yield* _(effectB(a));
  return b;
});

// GOOD: Use flatMap instead
effectA.pipe(Effect.flatMap((a) => effectB(a)));
```

### Error Handling

**Use Effect.tryPromise for async operations:**

```typescript
// GOOD: Effect.tryPromise with typed error
Effect.tryPromise({
  try: async () => fetch("/api").then((r) => r.json()),
  catch: (error) =>
    new ApiError({
      message: "API call failed",
      cause: error,
    }),
})

// BAD: Legacy Effect.promise with mapError
Effect.promise(async () => fetch("/api")).pipe(
  Effect.mapError((error: unknown) => new ApiError({ ... }))
)
```

**Preserve error types in catchAll:**

```typescript
// GOOD: Let TypeScript infer error type
storage.queryRaw(sql).pipe(
  Effect.catchAll((error) => {
    // error is StorageError (inferred)
    return Effect.fail(new MyError({ message: error.message, cause: error }))
  })
)

// BAD: Explicit unknown loses type information
storage.queryRaw(sql).pipe(
  Effect.catchAll((error: unknown) => { ... })
)
```

**Acceptable `error: unknown` contexts:**

- `Effect.tryPromise` catch handlers (per Effect-TS spec)
- Error constructor `cause` parameters
- When immediately wrapping in typed error

### Type Safety

**Never use type assertions to hide Effect dependencies:**

```typescript
// BAD: Hides dependencies, causes runtime errors
const ServiceLayer = Layer.effect(
  ServiceTag,
  Effect.sync(() => implementation) as Effect<Service, never, never>,
);

// GOOD: Declares dependencies explicitly
const ServiceLayer = Layer.effect(
  ServiceTag,
  Effect.gen(function* (_) {
    const dep1 = yield* _(Dependency1Tag);
    const dep2 = yield* _(Dependency2Tag);
    return implementation(dep1, dep2);
  }),
);
```

**Avoid `as any` in Effect code:**

- Unacceptable: Internal APIs, mocks, service interfaces
- Acceptable (with caution): External API responses we don't control
- Better: Use `@effect/schema` for validation

```typescript
// GOOD: Type-safe API response
const ResponseSchema = Schema.Struct({
  data: Schema.Array(Schema.String),
  meta: Schema.Struct({ count: Schema.Number }),
});

Effect.tryPromise({
  try: () => fetch("/api").then((r) => r.json()),
  catch: (e) => new FetchError({ cause: e }),
}).pipe(Effect.flatMap(Schema.decodeUnknown(ResponseSchema)));
```

### Test Patterns

**Use layers for test mocks:**

```typescript
// GOOD: Mock via Layer
const MockStorageLayer = Layer.succeed(StorageTag, {
  query: () => Effect.succeed(mockResult),
  save: () => Effect.void,
})

await Effect.runPromise(
  serviceOperation.pipe(Effect.provide(MockStorageLayer))
)

// BAD: Helper functions with type constraints
const runTest = <A, E, R>(effect: Effect.Effect<A, E, R>) => ...
```

**Prefix unused parameters in mocks:**

```typescript
// GOOD: Unused params prefixed with _
const MockService = {
  fetch: (_url: string, _options: Options) => Effect.succeed(mockData),
};

// BAD: Triggers noUnusedParameters warning
const MockService = {
  fetch: (url: string, options: Options) => Effect.succeed(mockData),
};
```

**Direct Effect.runPromise in tests:**

```typescript
// GOOD: Direct and explicit
const result = await Effect.runPromise(
  myEffect.pipe(Effect.provide(TestLayer)),
);

// BAD: Abstracted helper hiding complexity
const result = await runTest(myEffect);
```

### Anti-Patterns to Avoid

| Anti-Pattern                  | Problem                 | Solution                                 |
| ----------------------------- | ----------------------- | ---------------------------------------- |
| `Effect.Adaptor`              | Circumvents type safety | Direct Effect chains with proper typing  |
| `as Effect<A, E, never>`      | Hides dependencies      | Declare dependencies in layer signatures |
| `Effect.gen` for single yield | Over-engineering        | Direct pipe or flatMap                   |
| `error: unknown` in catchAll  | Loses type information  | Let TypeScript infer error type          |
| `Effect.promise` + `mapError` | Legacy pattern          | Use `Effect.tryPromise`                  |
| `runTest` helpers             | Type constraint issues  | Direct `Effect.runPromise`               |

### Detection Commands

```bash
# Find type assertions hiding dependencies
rg "as\s+(unknown\s+as\s+)?Effect<[^>]+,\s*[^>]+,\s*never>" --type ts

# Find Effect.gen anti-patterns (single yield)
rg "Effect\.gen\(function\* \(_\)" --type ts

# Find error: unknown in error handlers
rg "Effect\.(mapError|catchAll)\(\(error:\s*unknown\)" --type ts

# Find legacy Effect.promise
rg "Effect\.promise\(" --type ts
```

---

_Convention analysis: 2026-01-15_ _Update when patterns change_
