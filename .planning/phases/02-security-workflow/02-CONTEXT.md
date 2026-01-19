# Phase 2: Security Workflow - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Security verification as a blocking workflow gate. Agent-driven security review that runs before every commit/PR, produces findings documentation, and blocks on Critical/High/Medium severity issues.

</domain>

<decisions>
## Implementation Decisions

### Review Trigger
- Agent-driven review (not scripted tool) — Claude reviews the work tree
- Documented workflow in CLAUDE.md — agent reads and follows before declaring work complete
- Runs on every commit/PR — not optional, not only for sensitive changes
- Similar to integration tests as a sanity check to verify a commit

### Finding Categories
- Four severity levels: Critical / High / Medium / Low
- Blockers: Critical + High + Medium (only Low is non-blocking)
- All findings must be fixed — no exceptions, no accepted-risk mechanism
- Pre-existing findings also block — cannot declare work complete with any Critical/High/Medium findings

### Review Scope
- Full spectrum coverage: OWASP Top 10 + secrets + dependencies + API security + data handling
- Dependency scanning (pnpm audit) runs as part of every review
- Secrets detection is part of agent review (no separate tool)
- Scope: Changed files + files they import/affect (not full codebase every time)

### Output Format
- Findings recorded in `.planning/codebase/SECURITY-REVIEW.md`
- Cumulative history — append new findings, keep full audit trail
- Full audit trail per review: findings + reviewed files + rationale + recommendations
- CONCERNS.md references SECURITY-REVIEW.md (single source of truth, no duplication)

### Claude's Discretion
- Exact SECURITY-REVIEW.md structure and formatting
- How to determine "related files" for scope expansion
- Methodology for categorizing finding severity
- How to integrate dep scan results into review output

</decisions>

<specifics>
## Specific Ideas

- "Should be done by agents similar to integration tests as a sanity check to verify a commit"
- CONCERNS.md points to SECURITY-REVIEW.md rather than duplicating findings — single source of truth

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-security-workflow*
*Context gathered: 2026-01-19*
