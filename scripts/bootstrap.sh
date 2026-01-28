#!/bin/bash
set -e

rm -rf node_modules
pnpm install
pnpm exec playwright install chromium --with-deps
