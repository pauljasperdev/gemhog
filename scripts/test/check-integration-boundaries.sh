#!/usr/bin/env bash
# scripts/test/check-integration-boundaries.sh
# Automated boundary guardrails to prevent regressions in integration DB infrastructure
# Enforces new architecture conventions after migration from @gemhog/db/test

set -euo pipefail

ERRORS=0

echo "=== Integration Boundary Checks ==="
echo ""

# Check 1: No Docker lifecycle commands in TypeScript integration tests
echo "Check 1: No Docker lifecycle commands in TypeScript integration tests..."
if grep -R "docker run\|docker exec\|docker stop\|docker rm\|docker ps" packages --include='*.int.test.ts' --include='*.test.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found Docker lifecycle commands in TypeScript integration tests"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 2: No execSync/spawn/execFile for Docker orchestration in integration tests
echo "Check 2: No execSync/spawn/execFile for Docker orchestration in integration tests..."
DOCKER_EXEC_FOUND=0
if grep -R "execSync\|spawn(\|execFile(" packages --include='*.int.test.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  # Check if these are in context of docker commands
  if grep -R "execSync.*docker\|spawn.*docker\|execFile.*docker" packages --include='*.int.test.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
    echo "FAIL: Found execSync/spawn/execFile used for Docker orchestration in integration tests"
    DOCKER_EXEC_FOUND=1
    ERRORS=$((ERRORS + 1))
  fi
fi
if [ $DOCKER_EXEC_FOUND -eq 0 ]; then
  echo "PASS"
fi
echo ""

# Check 3: No pg or @types/pg dependencies in @gemhog/podcast package
echo "Check 3: No pg or @types/pg dependencies in @gemhog/podcast package..."
if grep -E '"pg"|"@types/pg"' packages/podcast/package.json 2>/dev/null; then
  echo "FAIL: Found pg or @types/pg in @gemhog/podcast package.json"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 4: No raw schema SQL (information_schema queries) in podcast test files
echo "Check 4: No raw schema SQL (information_schema queries) in podcast test files..."
if grep -R "information_schema" packages/podcast/tests/ 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found information_schema queries in podcast test files"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 5: No db.insert(schema.user) in auth integration tests (bypasses better-auth)
echo "Check 5: No db.insert(schema.user) in auth integration tests..."
if grep -R "db\.insert(schema\.user)" packages/auth/tests --include='*.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found db.insert(schema.user) in auth integration tests"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 6: No assertPodscanSchema usage in test files
echo "Check 6: No assertPodscanSchema usage in test files..."
if grep -R "assertPodscanSchema" packages --include='*.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found assertPodscanSchema in test files"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 7: No schema-preflight.ts helpers in consumer package tests
echo "Check 7: No schema-preflight.ts helpers in consumer package tests..."
if find packages -name "schema-preflight.ts" 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules" | grep -v "packages/db/"; then
  echo "FAIL: Found schema-preflight.ts in consumer package tests"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 8: No information_schema in consumer-package tests (except packages/db/tests/drizzle/migrations)
echo "Check 8: No information_schema in consumer-package tests..."
if grep -R "information_schema" packages --include='*.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules" | grep -v "packages/db/tests/drizzle/migrations"; then
  echo "FAIL: Found information_schema in consumer-package test files"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 9: No @gemhog/db/test imports anywhere in packages
echo "Check 9: No @gemhog/db/test imports anywhere in packages..."
if grep -R "@gemhog/db/test" packages --include='*.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found @gemhog/db/test imports in packages"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 10: No IntegrationTestDbEnv anywhere in packages
echo "Check 10: No IntegrationTestDbEnv anywhere in packages..."
if grep -R "IntegrationTestDbEnv" packages --include='*.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found IntegrationTestDbEnv in packages"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 11: No process.env.DATABASE_URL or process.env.DATABASE_URL_POOLER reads in .int.test.ts files
echo "Check 11: No process.env.DATABASE_URL reads in .int.test.ts files..."
if grep -R "process\.env\.DATABASE_URL\|process\.env\.DATABASE_URL_POOLER" packages --include='*.int.test.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found process.env.DATABASE_URL reads in .int.test.ts files"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 12: No hardcoded postgresql://.*localhost literals in .int.test.ts files
echo "Check 12: No hardcoded postgresql://.*localhost literals in .int.test.ts files..."
if grep -R "postgresql://.*localhost" packages --include='*.int.test.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found hardcoded postgresql://localhost literals in .int.test.ts files"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 13: No ConfigProvider.orElse.*ConfigProvider.fromEnv in packages/env/src/test.ts
echo "Check 13: No ConfigProvider.orElse.*ConfigProvider.fromEnv in packages/env/src/test.ts..."
if grep -R "ConfigProvider\.orElse.*ConfigProvider\.fromEnv" packages/env/src/test.ts 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found ConfigProvider.orElse with ConfigProvider.fromEnv in packages/env/src/test.ts"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 14: Single integration runner architecture enforced
echo "Check 14: Single integration runner architecture enforced..."
ARCH_ERRORS=0
# Positive: unified runner must exist
if [ ! -f "scripts/test/integration.sh" ]; then
  echo "FAIL: scripts/test/integration.sh does not exist — unified runner is missing"
  ARCH_ERRORS=1
  ERRORS=$((ERRORS + 1))
fi
# Negative: split runners must be gone
if [ -f "scripts/test/integration-consumer.sh" ] || [ -f "scripts/test/integration-migrations.sh" ]; then
  echo "FAIL: Found split integration runner script(s) — only scripts/test/integration.sh should exist"
  [ -f "scripts/test/integration-consumer.sh" ] && echo "  - scripts/test/integration-consumer.sh"
  [ -f "scripts/test/integration-migrations.sh" ] && echo "  - scripts/test/integration-migrations.sh"
  ARCH_ERRORS=1
  ERRORS=$((ERRORS + 1))
fi
if [ $ARCH_ERRORS -eq 0 ]; then
  echo "PASS"
fi
echo ""

# Check 15: No leaked compose project containers (gemhog-test)
echo "Check 15: No leaked gemhog-test compose project containers..."
LEAKED_COMPOSE=$(docker compose -p gemhog-test ls 2>/dev/null | grep "gemhog-test" | grep -v "NAME" || echo "")
if [ -n "$LEAKED_COMPOSE" ]; then
  echo "FAIL: gemhog-test compose project is still running — leaked containers"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 16: No makeIntegrationTestDbConfigLayer factory usage
echo "Check 16: No makeIntegrationTestDbConfigLayer factory usage..."
if grep -R "makeIntegrationTestDbConfigLayer" packages --include='*.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found makeIntegrationTestDbConfigLayer - use ConfigLayerTest from @gemhog/env/src/test.ts"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 17: No inline PgClient.layerConfig in .int.test.ts files
echo "Check 17: No inline PgClient.layerConfig in .int.test.ts files..."
if grep -R "PgClient\.layerConfig" packages --include='*.int.test.ts' 2>/dev/null | grep -v ".sisyphus" | grep -v "node_modules"; then
  echo "FAIL: Found inline PgClient.layerConfig in .int.test.ts files - import PgIntegrationLive or DrizzleIntegrationLive from @gemhog/db"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""
# Check 18: No split integration public API in package.json
echo "Check 18: No split integration public API in package.json..."
if grep -E '"test:integration:consumer"|"test:integration:migrations"' package.json 2>/dev/null; then
  echo "FAIL: Found split integration script keys in package.json — only test:integration and test:integration:boundaries should exist"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 19: No split Vitest integration config files at repo root
echo "Check 19: No split Vitest integration config files at repo root..."
SPLIT_CONFIGS=0
[ -f "vitest.integration.consumer.config.ts" ] && SPLIT_CONFIGS=1
[ -f "vitest.integration.migrations.config.ts" ] && SPLIT_CONFIGS=1
if [ $SPLIT_CONFIGS -eq 1 ]; then
  echo "FAIL: Found split Vitest integration config file(s) — only vitest.integration.config.ts should exist"
  [ -f "vitest.integration.consumer.config.ts" ] && echo "  - vitest.integration.consumer.config.ts"
  [ -f "vitest.integration.migrations.config.ts" ] && echo "  - vitest.integration.migrations.config.ts"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Check 20: No shell-level drizzle-kit migrate bootstrap in integration runner
echo "Check 20: No shell-level drizzle-kit migrate bootstrap in integration runner..."
if grep -n "drizzle-kit migrate\|db:test:migrate" scripts/test/integration.sh 2>/dev/null; then
  echo "FAIL: Found drizzle-kit migrate or db:test:migrate in scripts/test/integration.sh — migrations must be applied programmatically by the migration suite"
  ERRORS=$((ERRORS + 1))
else
  echo "PASS"
fi
echo ""

# Summary
echo "========================================="
if [ $ERRORS -gt 0 ]; then
  echo "FAILED: $ERRORS boundary check(s) failed"
  exit 1
else
  echo "All boundary checks passed."
  exit 0
fi
