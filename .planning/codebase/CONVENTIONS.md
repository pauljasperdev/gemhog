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
- Biome formatter (`biome.json`)
- Indentation: Tabs
- Quotes: Double quotes
- Semicolons: Enforced (Biome default)

**Linting:**
- Biome linter with recommended rules
- `useSelfClosingElements: error`
- `useSingleVarDeclarator: error`
- `useDefaultParameterLast: error`
- `noUnusedTemplateLiteral: error`
- `noInferrableTypes: error`
- Run: `pnpm run check`

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

**When to Comment:**
- Explain non-obvious business logic
- Document complex type constraints
- Avoid obvious comments

**JSDoc/TSDoc:**
- Not widely used in this codebase
- Self-documenting code preferred

**TODO Comments:**
- Not detected in current codebase

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

---

*Convention analysis: 2026-01-15*
*Update when patterns change*
