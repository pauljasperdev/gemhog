# Phase 2: Security Workflow - Research

**Researched:** 2026-01-19
**Domain:** Agent-driven security verification workflow (documentation, not tooling)
**Confidence:** HIGH

## Summary

This phase establishes an agent-driven security review workflow where Claude (the AI agent) reads and follows documented instructions before declaring work complete. Unlike traditional automated security tools, this is a documented workflow that agents execute manually, similar to how integration tests serve as sanity checks before commits.

The key insight from CONTEXT.md is that security review should be treated like integration tests: a mandatory verification step that runs on every commit, produces documented findings, and blocks completion if issues are found. The difference is that security review is performed by the agent reading files and applying judgment, not by running automated scanners.

**Primary recommendation:** Structure CLAUDE.md with clear, actionable security review instructions that integrate with the existing verification workflow. Use a cumulative SECURITY-REVIEW.md format that appends findings per review session, maintaining full audit trail while keeping CONCERNS.md as a reference pointer without duplication.

## Standard Stack

Since this phase is about workflow documentation (not tooling), "stack" refers to the documentation patterns and single required tool.

### Core
| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| CLAUDE.md | Agent instruction documentation | Already exists, agents read it first |
| SECURITY-REVIEW.md | Cumulative findings record | Single source of truth for security history |
| CONCERNS.md | Reference pointer | Avoids duplication, points to SECURITY-REVIEW.md |
| pnpm audit | Dependency vulnerability scan | Built into pnpm, runs against npm/GitHub advisory database |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| SECURITY-CHECKLIST.md | Reference checklist | Agent consults during review, already exists |
| git diff | Changed file identification | Agent uses to determine review scope |

### pnpm audit Integration

The `pnpm audit` command is the only automated tool in this workflow. Key options:

```bash
# Basic audit with JSON output for parsing
pnpm audit --json

# Filter by severity (low, moderate, high, critical)
pnpm audit --audit-level high

# Production dependencies only
pnpm audit --prod

# Recursive for monorepo
pnpm audit -r
```

**Exit codes:** Non-zero if vulnerabilities found at or above audit-level.

**Source:** [pnpm audit documentation](https://pnpm.io/cli/audit)

## Architecture Patterns

### Recommended Documentation Structure

```
.planning/codebase/
├── SECURITY-CHECKLIST.md   # Reference checklist (already exists)
├── SECURITY-REVIEW.md      # Cumulative findings (to create)
└── CONCERNS.md             # Points to SECURITY-REVIEW.md (update)

CLAUDE.md                   # Agent instructions (update)
```

### Pattern 1: CLAUDE.md Security Section Structure

**What:** A dedicated section in CLAUDE.md that agents read and follow before declaring work complete.

**When to use:** Every commit/PR - this is mandatory, not optional.

**Structure:**

```markdown
## Security Verification (MANDATORY)

**Run security review BEFORE declaring work complete.** This is non-negotiable.

### When to Run

Security review runs on every commit, not just for "sensitive" changes:
- Changed authentication/authorization code
- Added new API endpoints
- Modified data handling
- Changed dependencies
- ALL other changes (security issues hide in unexpected places)

### How to Run

1. **Identify scope:** Changed files + files they import
   - Run `git diff --name-only HEAD~1` (or vs main branch)
   - For each changed file, identify imports and callers

2. **Run dependency audit:**
   ```bash
   pnpm audit --audit-level low
   ```
   - Any moderate/high/critical findings block completion

3. **Review against SECURITY-CHECKLIST.md:**
   - Read `.planning/codebase/SECURITY-CHECKLIST.md`
   - Apply each relevant category to changed files
   - Document findings in SECURITY-REVIEW.md

4. **Record findings:**
   - Append new review session to `.planning/codebase/SECURITY-REVIEW.md`
   - Include: date, scope, findings, rationale, recommendations

### Severity Levels and Blocking

| Severity | Action | Can Complete? |
|----------|--------|---------------|
| Critical | Fix immediately | NO |
| High | Fix immediately | NO |
| Medium | Fix before completion | NO |
| Low | Document, fix when convenient | YES |

**Only Low severity findings are non-blocking.**

### Pre-existing Findings

If SECURITY-REVIEW.md contains any unresolved Critical/High/Medium findings:
- Work CANNOT be declared complete
- Either fix the findings or escalate to project owner
```

### Pattern 2: Cumulative SECURITY-REVIEW.md Format

**What:** An append-only document that maintains full audit history.

**When to use:** Every security review session appends a new entry.

**Structure:**

```markdown
# Security Review Log

Cumulative security findings for the Gemhog project.
Each review session is appended below, maintaining full audit trail.

---

## Review: [YYYY-MM-DD] - [Brief Description]

**Reviewer:** Claude (agent)
**Commit/Branch:** [git ref or branch name]
**Scope:** [list of files reviewed]

### Dependency Audit

```
[output of pnpm audit, or "No vulnerabilities found"]
```

### Files Reviewed

| File | Categories Checked | Result |
|------|-------------------|--------|
| src/auth/login.ts | Auth, Input Validation | PASS |
| src/api/users.ts | Auth, SQL, Input | FAIL (Medium) |

### Findings

#### [ID] [Severity] - [Title]

- **File:** `path/to/file.ts:line`
- **Category:** [SECURITY-CHECKLIST.md category]
- **Description:** [what the issue is]
- **Risk:** [what could go wrong]
- **Recommendation:** [how to fix]
- **Status:** Open | Fixed (in this commit) | Deferred (Low only)

### Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | - |
| High | 0 | - |
| Medium | 1 | Fixed |
| Low | 2 | Documented |

### Sign-off

- [x] Dependency audit passed (or vulnerabilities fixed)
- [x] All Critical/High/Medium findings resolved
- [x] Low findings documented
- [x] Ready for completion

---

[Previous review sessions below...]
```

### Pattern 3: CONCERNS.md Reference Pattern

**What:** CONCERNS.md points to SECURITY-REVIEW.md instead of duplicating findings.

**When to use:** When security findings need visibility in CONCERNS.md.

**Structure for CONCERNS.md Security Section:**

```markdown
## Security Considerations

Security findings from reviews. See `.planning/codebase/SECURITY-REVIEW.md` for
full audit trail and details.

### Current Open Findings

**Summary (as of [date]):**
- Critical: 0
- High: 0
- Medium: 0 (all resolved)
- Low: 3 (documented, non-blocking)

For details, see individual findings in SECURITY-REVIEW.md:
- [SEC-001] Missing rate limiting - Low
- [SEC-002] Debug logging - Low
- [SEC-003] Missing env validation - Low

_Last synced from SECURITY-REVIEW.md: [date]_
```

### Pattern 4: Scope Determination (Changed + Affected Files)

**What:** How agents determine which files to review.

**When to use:** Every security review to define scope.

**Approach:**

1. **Get changed files:**
   ```bash
   git diff --name-only HEAD~1  # For single commit
   git diff --name-only main    # For branch vs main
   ```

2. **Identify imports (manual agent analysis):**
   - For each changed file, look at what it imports
   - For each changed file, identify callers (who imports it)
   - This is judgment-based, not automated

3. **Scope determination heuristics:**
   - Changed file is a utility? Review all callers
   - Changed file imports auth? Review auth interaction
   - Changed file handles user input? Review input path to database
   - Changed file exports API? Review all endpoints using it

**Example scope for typical changes:**

| Change Type | Review Scope |
|-------------|--------------|
| New API endpoint | The endpoint file + router + any called services |
| Auth utility change | The utility + all files that import it |
| Schema change | Schema file + all queries using affected tables |
| New dependency | package.json + files using the new dependency |
| Config change | Config file + all files reading that config |

### Anti-Patterns to Avoid

- **Reviewing entire codebase every time:** Scope to changed + affected files only
- **Skipping review for "safe" changes:** Security issues hide everywhere
- **Duplicating findings in CONCERNS.md:** Point to SECURITY-REVIEW.md instead
- **Overwriting SECURITY-REVIEW.md:** Append new sessions, maintain history
- **Treating dependency audit as optional:** It's part of every review

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency scanning | Custom npm vulnerability check | pnpm audit | Uses official npm/GitHub advisory database |
| Finding changed files | Custom file watcher | git diff --name-only | Git is authoritative for changes |
| Security categories | Invent new categories | SECURITY-CHECKLIST.md | Already comprehensive, OWASP-based |
| Secrets detection | Regex patterns | Agent judgment on SECURITY-CHECKLIST.md | Context matters, patterns have false positives |

**Key insight:** The agent-driven approach leverages Claude's ability to understand context and apply judgment. Automated tools are useful for exhaustive checks (pnpm audit), but security review requires understanding business logic, data flow, and intent - which agents excel at.

## Common Pitfalls

### Pitfall 1: Skipping review for "infrastructure" changes
**What goes wrong:** Security issues introduced in "non-code" changes (config, deps, CI).
**Why it happens:** False assumption that only application code has security implications.
**How to avoid:** Run security review on ALL changes. The checklist includes dependencies, configuration, and secrets.
**Warning signs:** Unreviewed changes to package.json, .env files, or CI configs.

### Pitfall 2: Not checking for pre-existing findings
**What goes wrong:** Declaring work complete with existing Critical/High/Medium findings.
**Why it happens:** Only reviewing new changes, not checking SECURITY-REVIEW.md history.
**How to avoid:** First step of review: check for any open blocking findings.
**Warning signs:** SECURITY-REVIEW.md has Open items at Critical/High/Medium severity.

### Pitfall 3: Scope too narrow
**What goes wrong:** Missing vulnerabilities in files affected by changes.
**Why it happens:** Only reviewing directly changed files, not imports/callers.
**How to avoid:** Always trace imports and callers for changed files.
**Warning signs:** Security issue in caller discovered after merge.

### Pitfall 4: pnpm audit not run
**What goes wrong:** Vulnerable dependencies deployed.
**Why it happens:** Treating pnpm audit as separate from security review.
**How to avoid:** Make pnpm audit the FIRST step of every security review.
**Warning signs:** Dependencies with known CVEs in production.

### Pitfall 5: Medium severity treated as non-blocking
**What goes wrong:** Medium issues accumulate, never get fixed.
**Why it happens:** User decided Medium should block, but agent treats it like Low.
**How to avoid:** Clear documentation: Critical, High, AND Medium all block.
**Warning signs:** SECURITY-REVIEW.md accumulates Medium findings.

### Pitfall 6: CONCERNS.md becomes stale
**What goes wrong:** CONCERNS.md shows different findings than SECURITY-REVIEW.md.
**Why it happens:** Forgetting to update CONCERNS.md after security review.
**How to avoid:** CONCERNS.md only references SECURITY-REVIEW.md, doesn't duplicate.
**Warning signs:** Mismatch between files.

## Code Examples

### Example 1: CLAUDE.md Security Section (Complete)

```markdown
## Security Verification (MANDATORY)

**Run security review BEFORE declaring work complete.** Non-negotiable.

### Trigger

Security review runs on EVERY commit, not just "sensitive" changes.

### Workflow

1. **Check for blocking findings:**
   - Read `.planning/codebase/SECURITY-REVIEW.md`
   - If any Open Critical/High/Medium findings exist, STOP
   - Either fix them first or escalate

2. **Determine scope:**
   - Run `git diff --name-only HEAD~1` (or vs main)
   - For each file: identify what it imports
   - For each file: identify what imports it
   - Scope = changed files + their imports + their callers

3. **Run dependency audit:**
   ```bash
   pnpm audit --audit-level low
   ```
   - Moderate or higher: blocking, must fix or justify
   - Document in SECURITY-REVIEW.md

4. **Review code:**
   - Read `.planning/codebase/SECURITY-CHECKLIST.md`
   - Apply relevant categories to scoped files
   - Use judgment - checklist is guide, not exhaustive

5. **Record findings:**
   - Append new session to `.planning/codebase/SECURITY-REVIEW.md`
   - Use format from existing sessions
   - Include: date, scope, dependency audit result, findings, sign-off

6. **Resolve blocking findings:**
   - Fix any Critical/High/Medium issues found
   - Re-run affected checks
   - Update finding status to "Fixed"

7. **Update CONCERNS.md:**
   - Update summary counts if changed
   - Do NOT duplicate findings, just reference

### Severity and Blocking

| Severity | Blocks Completion | Action |
|----------|-------------------|--------|
| Critical | YES | Fix immediately, no exceptions |
| High | YES | Fix immediately, no exceptions |
| Medium | YES | Fix before declaring complete |
| Low | NO | Document, fix when convenient |

### What "Complete" Means (with Security)

Work is complete when:
- [ ] No Open Critical/High/Medium in SECURITY-REVIEW.md (pre-existing or new)
- [ ] pnpm audit passes (no moderate or higher vulnerabilities)
- [ ] Current changes reviewed and documented in SECURITY-REVIEW.md
- [ ] All other verification passes (`pnpm verify`)
```

### Example 2: SECURITY-REVIEW.md Session Entry

```markdown
## Review: 2026-01-20 - Add user profile API

**Reviewer:** Claude (agent)
**Commit:** feat(api): add user profile endpoint
**Scope:**
- `packages/api/src/routers/user.ts` (changed)
- `packages/api/src/routers/index.ts` (imports user)
- `packages/db/src/schema/users.ts` (user.ts imports this)
- `packages/auth/src/index.ts` (user.ts imports session utils)

### Dependency Audit

```
pnpm audit --audit-level low
No vulnerabilities found
```

### Files Reviewed

| File | Categories | Result |
|------|------------|--------|
| packages/api/src/routers/user.ts | Input Validation, Auth, SQL | PASS |
| packages/api/src/routers/index.ts | N/A (just re-exports) | PASS |
| packages/db/src/schema/users.ts | SQL, Secrets | PASS |
| packages/auth/src/index.ts | Auth, Secrets | PASS |

### Findings

#### [SEC-004] Low - Debug console.log in user router

- **File:** `packages/api/src/routers/user.ts:45`
- **Category:** Logging
- **Description:** console.log outputs user object for debugging
- **Risk:** Could expose user data in production logs
- **Recommendation:** Remove or guard with NODE_ENV check
- **Status:** Documented (Low, non-blocking)

### Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | - |
| High | 0 | - |
| Medium | 0 | - |
| Low | 1 | Documented |

### Sign-off

- [x] Checked for pre-existing blocking findings (none)
- [x] Dependency audit passed
- [x] All Critical/High/Medium resolved (none found)
- [x] Low findings documented
- [x] Ready for completion
```

### Example 3: pnpm audit Integration in Review

```bash
# Run as first step of security review
pnpm audit --audit-level low

# If vulnerabilities found, document severity and decide:
# - Critical/High/Moderate: Must fix or document justification
# - Low: Document, proceed

# To fix:
pnpm audit --fix  # Adds overrides to package.json

# For stubborn dependencies, use overrides in package.json:
{
  "pnpm": {
    "overrides": {
      "vulnerable-package": "^2.0.0"
    }
  }
}
```

## Integration with Existing Workflow

### Current Verification Flow (from verify.sh)

```
Static Analysis → Unit Tests → Integration Tests → E2E Tests
```

### Proposed Verification Flow (with Security)

```
Static Analysis → Unit Tests → Integration Tests → Security Review → E2E Tests
```

**Why after integration, before E2E:**
- Security review needs working code (post-integration)
- E2E tests are slowest, run last
- Security issues should block before expensive E2E runs

### Updating verify.sh

Security review is agent-driven, not scripted. However, the `verify` script could include a reminder:

```bash
echo "=== Security Review ==="
echo "MANUAL STEP: Agent must complete security review"
echo "Check: .planning/codebase/SECURITY-REVIEW.md"
pnpm audit --audit-level low
echo ""
```

Or integrate pnpm audit as an automated check:

```bash
echo "=== Dependency Security ==="
pnpm audit --audit-level moderate || {
  echo "FAIL: Dependency vulnerabilities found"
  echo "Run 'pnpm audit' for details"
  exit 1
}
echo "OK dependencies"
```

### Verify:commit vs Verify (Full)

| Command | Security Action |
|---------|-----------------|
| `verify:commit` | Quick: pnpm audit + check for blocking findings |
| `verify` (full) | Full: complete security review + pnpm audit |

## State of the Art

| Old Approach | Current Approach | Why Changed |
|--------------|------------------|-------------|
| Separate security tool runs | Agent-driven review | Context matters more than exhaustive scanning |
| One-time security audit | Per-commit review | Continuous verification catches issues early |
| SAST/DAST only | SAST + human judgment | AI-generated code needs human/agent review |
| Security findings in separate system | Cumulative in-repo log | Full audit trail, version controlled |

**Industry trends (2025-2026):**
- AI-powered code review augments (not replaces) security tools
- DevSecOps: security integrated into development workflow, not separate phase
- "Shift left": find security issues at commit time, not deployment
- Agent-assisted review: Claude/GPT for context-aware security analysis

**Source:** [Endor Labs - AI Security Code Review](https://www.endorlabs.com/learn/introducing-ai-security-code-review)

## Open Questions

Things that couldn't be fully resolved:

1. **Import/caller analysis depth**
   - What we know: Agent should review changed files + imports + callers
   - What's unclear: How many levels deep? (A imports B imports C - if C changes, review A?)
   - Recommendation: One level deep for imports, one level for callers. Deeper if the changed code is security-critical (auth, input handling).

2. **pnpm audit severity mapping to workflow severity**
   - What we know: pnpm audit uses low/moderate/high/critical; workflow uses Critical/High/Medium/Low
   - What's unclear: Exact mapping (is pnpm "moderate" = workflow "Medium"?)
   - Recommendation: Map directly: pnpm critical=Critical, high=High, moderate=Medium, low=Low. Moderate/Medium blocks per user decision.

3. **Historical findings cleanup**
   - What we know: SECURITY-REVIEW.md is cumulative, append-only
   - What's unclear: When/how to archive old resolved findings?
   - Recommendation: Keep all history. If file grows too large, create annual archive files (e.g., SECURITY-REVIEW-2025.md).

## Sources

### Primary (HIGH confidence)
- [pnpm audit documentation](https://pnpm.io/cli/audit) - Command options, flags, exit codes
- [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/) - Review methodology
- [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) - Category coverage
- Existing SECURITY-CHECKLIST.md in repo - Current checklist structure

### Secondary (MEDIUM confidence)
- [Endor Labs - AI Security Code Review](https://www.endorlabs.com/learn/introducing-ai-security-code-review) - Agent-driven review patterns
- [Graphite - AI Code Review Best Practices](https://graphite.com/guides/ai-code-review-implementation-best-practices) - Workflow integration
- [Audit Trail Best Practices](https://www.ccmonet.ai/blog/audit-trail-documentation-best-practices-guide) - Documentation format

### Tertiary (LOW confidence)
- WebSearch results on cumulative audit logs - General patterns

## Metadata

**Confidence breakdown:**
- CLAUDE.md structure: HIGH - Based on existing CLAUDE.md patterns in repo
- SECURITY-REVIEW.md format: HIGH - Derived from existing SECURITY-CHECKLIST.md template
- pnpm audit integration: HIGH - Official documentation verified
- Scope determination: MEDIUM - Based on OWASP guidance, not automated tool
- Workflow integration: HIGH - Follows existing verify.sh patterns

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - workflow documentation is stable)
