# gemhog

## Getting Started

First, install the dependencies:

```bash
pnpm bootstrap
```

## Local development

`pnpm dev` sets `LOCAL_ENV=1` to load defaults from `@gemhog/env/local-dev`.
Root `db:*` scripts do the same for migrations. Override any value by exporting
environment variables in your shell. There are no per-app `.env` files; the root
`.env` is only for deployment/infrastructure contexts.
