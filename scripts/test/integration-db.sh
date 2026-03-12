#!/usr/bin/env bash
# scripts/test/integration-db.sh
# Shared compose helpers for ephemeral Postgres lifecycle in integration tests.
# This file is SOURCED by other scripts/test/*.sh scripts — do NOT run directly.

set -euo pipefail

COMPOSE_FILE="infra/docker-compose.test.yml"
COMPOSE_PROJECT="gemhog-test"

# Start the test database via docker compose
integration_db_start() {
  echo "=== Starting test database ==="
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d
}

# Wait for Postgres to accept connections (uses container healthcheck)
integration_db_wait_ready() {
  echo "Waiting for Postgres readiness on localhost:5433..."
  local deadline
  deadline=$(( $(date +%s) + 60 ))
  until docker exec gemhog-test-postgres pg_isready -U postgres >/dev/null 2>&1; do
    if [[ $(date +%s) -ge $deadline ]]; then
      echo "ERROR: Postgres readiness timeout"
      return 1
    fi
    sleep 0.5
  done
  echo "Postgres is ready."
}

# Stop and remove the test database and its volumes
integration_db_stop() {
  echo "=== Stopping test database ==="
  docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" down -v --remove-orphans || true
}
