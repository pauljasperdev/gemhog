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

echo "=== E2E Tests ==="
pnpm test:e2e
echo "OK e2e"
echo ""

echo "========================================="
echo "ALL TESTS PASSED"
echo "========================================="
