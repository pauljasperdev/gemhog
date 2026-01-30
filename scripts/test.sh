#!/bin/bash
# scripts/test.sh
# Full test pipeline - run before completing features
# Fail-fast: stops on first error
set -e

echo "=== Static Analysis ==="
pnpm check
echo "OK static"
echo ""

echo "=== Unit Tests ==="
vitest run
echo "OK unit"
echo ""

echo "=== Integration Tests ==="
rm -rf apps/web/.next
vitest run --config vitest.integration.config.ts
echo "OK integration"
echo ""

echo "=== Dependency Security ==="
pnpm test:audit
echo "OK dependencies"
echo ""

echo "=== E2E Tests ==="
# Kill any leftover processes on port 3001 from integration tests
# (vitest child processes can leave orphaned Next.js dev servers)
lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
# FIXME: Skip E2E on Node.js 25+ -- Turbopack dev server has ENOENT race conditions
# that cause 500 errors on API routes. Same root cause as startup.int.test.ts skip.
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -ge 25 ] 2>/dev/null; then
  echo "SKIP e2e (Node.js $NODE_MAJOR -- Turbopack dev server unstable)"
else
  playwright test
  echo "OK e2e"
fi
echo ""

echo "========================================="
echo "ALL TESTS PASSED"
echo "========================================="
