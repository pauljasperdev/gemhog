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
vitest run --config vitest.integration.config.ts
echo "OK integration"
echo ""

echo "=== Dependency Security ==="
pnpm test:audit
echo "OK dependencies"
echo ""

echo "=== E2E Tests ==="
playwright test
echo "OK e2e"
echo ""

echo "========================================="
echo "ALL TESTS PASSED"
echo "========================================="
