#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_DIR="$ROOT_DIR/.repos"

mkdir -p "$REPOS_DIR"

REPOS=(
  "effect|https://github.com/Effect-TS/effect"
  "effect-aws|https://github.com/floydspace/effect-aws"
  "better-auth|https://github.com/better-auth/better-auth"
  "sst|https://github.com/sst/sst"
  "nextjs|https://github.com/vercel/next.js"
  "hono|https://github.com/honojs/hono"
  "pg|https://github.com/brianc/node-postgres"
  "drizzle-orm|https://github.com/drizzle-team/drizzle-orm"
  "trpc|https://github.com/trpc/trpc"
  "tanstack-query|https://github.com/TanStack/query"
  "posthog-js|https://github.com/PostHog/posthog-js"
  "sentry-javascript|https://github.com/getsentry/sentry-javascript"
  "zod|https://github.com/colinhacks/zod"
  "tailwindcss|https://github.com/tailwindlabs/tailwindcss"
  "shadcn-ui|https://github.com/shadcn-ui/ui"
  "ai|https://github.com/vercel/ai"
)

for entry in "${REPOS[@]}"; do
  name="${entry%%|*}"
  url="${entry#*|}"
  target="$REPOS_DIR/$name"

  if [ -d "$target" ]; then
    echo "[repos] skip $name (exists)"
    continue
  fi

  echo "[repos] clone $name"
  git clone --depth=1 "$url" "$target"
done
