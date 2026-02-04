#!/bin/bash
set -e

rm -rf node_modules
pnpm install
./scripts/fetch-repos.sh
pnpm exec playwright install chromium --with-deps
