# Agent Instructions

This project uses the
[GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done)
methodology for AI-assisted development. All project context lives in the
`.planning/` folder.

## Quick Start for AI Agents

**Read these files in order:**

1. `.planning/PROJECT.md` — Project vision, requirements, constraints, and key
   decisions
2. `.planning/codebase/ARCHITECTURE.md` — System architecture, layers, data
   flows
3. `.planning/codebase/STRUCTURE.md` — File/folder organization and package
   layout
4. `.planning/codebase/CONVENTIONS.md` — Coding standards and patterns to follow
5. `.planning/codebase/STACK.md` — Technology stack and dependencies

## Documentation Structure

```
.planning/
├── PROJECT.md              # Source of truth for what we're building
├── config.json             # GSD configuration
├── codebase/
│   ├── ARCHITECTURE.md     # How the system is structured
│   ├── STRUCTURE.md        # File and folder organization
│   ├── CONVENTIONS.md      # Coding patterns and standards
│   ├── STACK.md            # Technologies and dependencies
│   ├── INTEGRATIONS.md     # External services and APIs
│   ├── TESTING.md          # Test strategy and infrastructure
│   ├── CONCERNS.md         # Known issues and technical debt
│   └── SECURITY-CHECKLIST.md # Security review requirements
└── phases/                 # Implementation phases (roadmap)
```

## Key Context Files

| File                    | Purpose                              | When to Read                           |
| ----------------------- | ------------------------------------ | -------------------------------------- |
| `PROJECT.md`            | Requirements, constraints, decisions | Always — start here                    |
| `ARCHITECTURE.md`       | System design, data flows            | Before structural changes              |
| `SECURITY-CHECKLIST.md` | Security requirements                | Before implementing auth/data handling |
| `CONCERNS.md`           | Known issues, tech debt              | Before major refactoring               |
| `TESTING.md`            | Test strategy                        | Before writing tests                   |

## Important Constraints

- **Security-first**: Critical/high security findings block merge. Review
  `SECURITY-CHECKLIST.md` before implementing features handling user data or
  payments.
- **SST-agnostic code**: Application code reads env vars only — no SST SDK
  imports. This enables local development and agent verification without cloud
  context.
- **Effect TS for backend**: Required for testability and dependency injection
  (pending implementation).

## Verification Requirements (MANDATORY)

**Tests must pass before work is considered complete.** This is non-negotiable.

### Before Every Commit

Lefthook auto-runs on commit (or run `pnpm verify:commit` manually):
- Static analysis (lint + format)
- Type checking
- Unit tests
- Integration tests (requires Docker)

### Before Completing a Feature/Phase

Run full verification including integration and E2E:
```bash
pnpm verify          # Full pipeline: lint → types → unit → integration → e2e
```

### When to Run What

| When | Command | What runs |
|------|---------|-----------|
| Every commit | `pnpm verify:commit` | Lint + types + unit tests |
| Database changes | `pnpm test:integration` | Integration tests (requires `pnpm db:start` first) |
| Feature/phase complete | `pnpm verify` | All tests including E2E |

### Database Setup for Integration Tests

**Before running integration tests**, start the database:

```bash
pnpm db:start          # Start PostgreSQL container
pnpm test:integration  # Run integration tests
```

The database container stays running for subsequent test runs. Stop it with `pnpm db:stop`.

### Rules for Agents

1. **Run tests BEFORE declaring work complete** — not after
2. **Tests must pass** — "runs but fails" is NOT acceptable
3. **Fix failures before committing** — don't commit broken code
4. **Infrastructure changes require working tests** — if you add test tooling,
   verify it actually works end-to-end
5. **Pre-existing failures are blockers** — document in CONCERNS.md but don't
   ignore them

### What "Complete" Means

Work is complete when:
- [ ] `pnpm verify:commit` passes (lint + types + unit)
- [ ] `pnpm verify` passes for phase completion (includes integration + E2E)
- [ ] Security review completed (see below)
- [ ] No new errors introduced

## Security Verification (MANDATORY)

**Run security review BEFORE declaring work complete.** Non-negotiable.

### Trigger

Security review runs on EVERY commit, not just "sensitive" changes.
Security issues hide in unexpected places - infrastructure, config, dependencies.

### Workflow

1. **Check for blocking findings:**
   - Read `.planning/codebase/SECURITY-REVIEW.md`
   - If any Open Critical/High/Medium findings exist, STOP
   - Either fix them first or escalate to project owner

2. **Determine scope:**
   - Run `git diff --name-only HEAD~1` (or vs main branch)
   - For each changed file: identify what it imports
   - For each changed file: identify what imports it (callers)
   - Scope = changed files + their imports + their callers

3. **Run dependency audit:**
   ```bash
   pnpm audit --audit-level low
   ```
   - Moderate or higher: blocking, must fix or document justification
   - Document results in SECURITY-REVIEW.md

4. **Review code against checklist:**
   - Read `.planning/codebase/SECURITY-CHECKLIST.md`
   - Apply relevant categories to scoped files
   - Use judgment - checklist is guide, not exhaustive

5. **Record findings:**
   - Append new session to `.planning/codebase/SECURITY-REVIEW.md`
   - Include: date, scope, dependency audit result, findings, sign-off
   - Use format from existing sessions

6. **Resolve blocking findings:**
   - Fix any Critical/High/Medium issues found
   - Re-run affected checks
   - Update finding status to "Fixed"

7. **Update CONCERNS.md:**
   - Update summary counts if findings changed
   - Do NOT duplicate findings, just reference SECURITY-REVIEW.md

### Severity and Blocking

| Severity | Blocks Completion | Action |
|----------|-------------------|--------|
| Critical | YES | Fix immediately, no exceptions |
| High | YES | Fix immediately, no exceptions |
| Medium | YES | Fix before declaring complete |
| Low | NO | Document, fix when convenient |

**Only Low severity findings are non-blocking.**

### Pre-existing Findings

If SECURITY-REVIEW.md contains any unresolved Critical/High/Medium findings:
- Work CANNOT be declared complete
- Either fix the findings or escalate to project owner

## For Claude Code / Cursor / Other AI Tools

This file serves as the entry point. The detailed context lives in `.planning/`.
When working on this codebase:

1. Start with `PROJECT.md` to understand what we're building
2. Check relevant codebase docs before making changes
3. Follow patterns in `CONVENTIONS.md`
4. Verify security requirements in `SECURITY-CHECKLIST.md` for sensitive
   features
