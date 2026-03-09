#!/bin/bash
# scripts/test.sh
# Full test pipeline - run before completing features
# Fail-fast: stops on first error
set -e

echo "=== Static Analysis ==="
pnpm check
echo "OK static"
echo ""

echo "=== React Doctor ==="
react-doctor . --yes --no-ami
echo "OK react-doctor"
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


echo "========================================="
echo "ALL TESTS PASSED"
echo "========================================="
