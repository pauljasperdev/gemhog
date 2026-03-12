#!/usr/bin/env bash
# scripts/test/integration.sh
# Single integration test runner — one ephemeral Postgres lifecycle.
#
# Phase 1: Run the migration suite against a blank compose-backed DB.
#          The suite applies migrations itself (programmatic migrate).
#          On success, the migrated schema is left in place for Phase 2.
# Phase 2: Run all remaining integration suites against the migrated DB.
#
# Usage:
#   ./scripts/test/integration.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./integration-db.sh
source "$SCRIPT_DIR/integration-db.sh"

# Setup cleanup trap — tears down compose DB once on EXIT/INT/TERM
cleanup() {
  integration_db_stop
}
trap cleanup EXIT INT TERM

echo "=== Integration Tests: Single-Lifecycle Runner ==="

# Start compose DB once
integration_db_start

# Wait for readiness once
integration_db_wait_ready

# --- Phase 1: Migration bootstrap ---
echo ""
echo "=== Phase 1: Migration Bootstrap ==="
pnpm vitest run --config vitest.integration.config.ts packages/db/tests/drizzle/migrations.int.test.ts

# --- Phase 2: Consumer integration suites ---
echo ""
echo "=== Phase 2: Consumer Integration Tests ==="
pnpm vitest run --config vitest.integration.config.ts --exclude '**/migrations.int.test.ts'

echo ""
echo "=== Integration Tests Complete ==="
