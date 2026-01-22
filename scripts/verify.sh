#!/bin/bash
# scripts/verify.sh
# Full verification pipeline - run before completing features
# Fail-fast: stops on first error
set -e

echo "=== Static Analysis ==="
pnpm check
pnpm check-types
echo "OK static"
echo ""

echo "=== Unit Tests ==="
pnpm test:unit
echo "OK unit"
echo ""

echo "=== Integration Tests ==="
pnpm test:integration
echo "OK integration"
echo ""

echo "=== Dependency Security ==="
# --ignore-unfixable: Skip vulnerabilities in transitive deps we can't fix (e.g., SST's opencontrol)
pnpm audit --audit-level moderate --ignore-unfixable || {
  echo "FAIL: Dependency vulnerabilities found (moderate or higher)"
  echo "Run 'pnpm audit' for details"
  exit 1
}
echo "OK dependencies"
echo ""
echo "NOTE: Agent must also complete full security review"
echo "      See .planning/codebase/SECURITY-REVIEW.md"
echo ""

echo "=== E2E Tests ==="
pnpm test:e2e
echo "OK e2e"
echo ""

echo "========================================="
echo "ALL TESTS PASSED"
echo "========================================="
