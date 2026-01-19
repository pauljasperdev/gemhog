# Agent Instructions

This project uses the [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done) methodology for AI-assisted development. All project context lives in the `.planning/` folder.

## Quick Start for AI Agents

**Read these files in order:**

1. `.planning/PROJECT.md` — Project vision, requirements, constraints, and key decisions
2. `.planning/codebase/ARCHITECTURE.md` — System architecture, layers, data flows
3. `.planning/codebase/STRUCTURE.md` — File/folder organization and package layout
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

| File | Purpose | When to Read |
|------|---------|--------------|
| `PROJECT.md` | Requirements, constraints, decisions | Always — start here |
| `ARCHITECTURE.md` | System design, data flows | Before structural changes |
| `SECURITY-CHECKLIST.md` | Security requirements | Before implementing auth/data handling |
| `CONCERNS.md` | Known issues, tech debt | Before major refactoring |
| `TESTING.md` | Test strategy | Before writing tests |

## Important Constraints

- **Security-first**: Critical/high security findings block merge. Review `SECURITY-CHECKLIST.md` before implementing features handling user data or payments.
- **SST-agnostic code**: Application code reads env vars only — no SST SDK imports. This enables local development and agent verification without cloud context.
- **Effect TS for backend**: Required for testability and dependency injection (pending implementation).

## For Claude Code / Cursor / Other AI Tools

This file serves as the entry point. The detailed context lives in `.planning/`. When working on this codebase:

1. Start with `PROJECT.md` to understand what we're building
2. Check relevant codebase docs before making changes
3. Follow patterns in `CONVENTIONS.md`
4. Verify security requirements in `SECURITY-CHECKLIST.md` for sensitive features
