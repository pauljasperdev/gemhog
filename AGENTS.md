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
│   ├── TESTING.md          # Test commands and verification workflow
│   ├── CONCERNS.md         # Known issues and technical debt
│   ├── SECURITY-CHECKLIST.md # Security review checklist
│   └── SECURITY-REVIEW.md  # Security audit trail
└── phases/                 # Implementation phases (roadmap)
```

## Key Context Files

| File                    | Purpose                              | When to Read                               |
| ----------------------- | ------------------------------------ | ------------------------------------------ |
| `PROJECT.md`            | Requirements, constraints, decisions | Always — start here                        |
| `ARCHITECTURE.md`       | System design, data flows            | Before structural changes                  |
| `TESTING.md`            | Test commands and verification       | Before running tests or declaring complete |
| `SECURITY-CHECKLIST.md` | Security review checklist            | Before implementing auth/data handling     |
| `SECURITY-REVIEW.md`    | Security findings and audit trail    | Check for blocking findings before work    |
| `CONCERNS.md`           | Known issues, tech debt              | Before major refactoring                   |

## Available Skills

Use these skills (invoke with `/skill-name`) for specialized tasks:

| Skill                        | Purpose                                        | When to Use                                             |
| ---------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `/frontend-design`           | Create production-grade UI with high design quality | Building web components, pages, dashboards, React components |
| `/web-design-guidelines`     | Review UI code for best practices compliance   | Reviewing UI, checking accessibility, auditing UX       |
| `/copywriting`               | Write or improve marketing copy                | Homepage, landing pages, pricing, CTAs, feature pages   |
| `/better-auth-best-practices`| Integrate Better Auth authentication framework | Implementing or modifying authentication features       |

## Important Constraints

- **Security-first**: Critical/high security findings block merge. Review
  `SECURITY-CHECKLIST.md` before implementing features handling user data or
  payments.
- **SST-agnostic code**: Application code reads env vars only — no SST SDK
  imports. This enables local development and agent verification without cloud
  context.
- **Effect TS for backend**: Required for testability and dependency injection
  (pending implementation).

## Verification Requirements

**Before completing any plan, you MUST run:**

```bash
pnpm db:start && pnpm verify
```

**This is non-negotiable.** See `.planning/codebase/TESTING.md` for full
details.

## Security Requirements

**Security review required before declaring work complete.** See
`.planning/codebase/SECURITY-CHECKLIST.md` for the checklist and
`.planning/codebase/SECURITY-REVIEW.md` for the audit trail.

**Severity blocking:**

- Critical/High/Medium findings block completion
- Only Low severity is non-blocking

## For Non-GSD Workflows

If you're not using GSD commands, follow these verification steps manually:

1. **Before commits**: Run `pnpm verify:commit`
2. **Before completing work**: Run `pnpm verify` (full pipeline)
3. **Security review**: Work through `.planning/codebase/SECURITY-CHECKLIST.md`
4. **Record findings**: Append to `.planning/codebase/SECURITY-REVIEW.md`

See the detailed docs in `.planning/codebase/` for complete requirements.
