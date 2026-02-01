#!/bin/bash
set -e

rm -rf node_modules
pnpm ci
pnpm exec playwright install chromium --with-deps
