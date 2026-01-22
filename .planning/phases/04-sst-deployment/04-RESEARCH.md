# Phase 4: SST Deployment - Research

**Researched:** 2026-01-22
**Domain:** SST v3 AWS deployment, serverless infrastructure
**Confidence:** HIGH

## Summary

SST v3 is a modern infrastructure-as-code framework built on Pulumi/Terraform that
deploys full-stack apps to AWS. The codebase already follows the SST-agnostic
constraint (t3-env for env validation, no SST SDK imports), making deployment
straightforward.

Key findings:

1. **Monorepo structure**: SST recommends an `infra/` folder at repo root with one
   file per resource type, dynamically imported in `sst.config.ts`
2. **Hono streaming**: Use conditional handler (`handle` for dev, `streamHandle` for
   prod) since streaming is not supported in `sst dev`
3. **Secrets as Linkable**: Use `sst.Secret` for sensitive values, link to functions
   via SST's linking system (becomes `Resource.SecretName.value` at runtime)
4. **Neon via Linkable**: Create a custom `sst.Linkable` for Neon DATABASE_URL since
   Neon is external (not an SST-managed resource)
5. **Cloudflare DNS**: Add cloudflare provider, use `sst.cloudflare.dns()` adapter
   with zone ID for domain configuration

**Primary recommendation:** Follow the anomalyco/monorepo-template pattern with
separate infra files, use SST's linking for secrets, and conditionally export
streaming handler for production Lambda.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library            | Version | Purpose                          | Why Standard                                    |
| ------------------ | ------- | -------------------------------- | ----------------------------------------------- |
| sst                | ^3.17   | Infrastructure as code framework | Official SST v3, Pulumi/Terraform engine        |
| @hono/aws-lambda   | ^1.x    | Hono Lambda adapter              | Official Hono adapter with streaming support    |
| @t3-oss/env-core   | ^0.13   | Env validation (already in use)  | Type-safe env vars, SST-agnostic                |
| @t3-oss/env-nextjs | ^0.13   | Next.js env (already in use)     | Next.js-specific env validation                 |
| sst (SDK)          | ^3.17   | Runtime resource access          | `Resource` object for linked resources          |

### Supporting

| Library | Version | Purpose                | When to Use                          |
| ------- | ------- | ---------------------- | ------------------------------------ |
| aws     | (pulumi)| AWS resources          | Included via SST, for custom configs |

### Alternatives Considered

| Instead of      | Could Use           | Tradeoff                                       |
| --------------- | ------------------- | ---------------------------------------------- |
| SST Console     | GitHub Actions      | Console is simpler, GH Actions more flexible   |
| Linkable        | Raw env vars        | Linkable provides type-safety and permissions  |
| Function URL    | API Gateway         | URL supports streaming, APIGW does not         |

**Installation:**

```bash
# SST CLI (if not using npx)
pnpm add -D sst

# Hono Lambda adapter (add to apps/server)
pnpm --filter server add @hono/aws-lambda

# SST SDK for runtime resource access (add where needed)
pnpm add sst
```

## Architecture Patterns

### Recommended Project Structure

```
/
├── sst.config.ts           # Main SST config, imports infra/*
├── infra/
│   ├── secrets.ts          # SST secrets (DATABASE_URL, etc.)
│   ├── neon.ts             # Neon Linkable (external DB)
│   ├── api.ts              # Hono Lambda + Router
│   └── web.ts              # Next.js component
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── index.ts    # Hono app (unchanged)
│   │   │   ├── lambda.ts   # Lambda entrypoint (NEW)
│   │   │   └── serve.ts    # Local dev entrypoint (move from index.ts)
│   └── web/                # Next.js app (unchanged)
└── packages/
    └── env/                # t3-env validation (unchanged)
```

### Pattern 1: Dynamic Infra Imports

**What:** Dynamically import infra files in sst.config.ts run() function
**When to use:** Always for monorepo projects
**Example:**

```typescript
// sst.config.ts
// Source: https://github.com/sst/monorepo-template
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "gemhog",
      removal: input.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input.stage),
      home: "aws",
      providers: {
        aws: { region: "eu-central-1" },
        cloudflare: true,
      },
    };
  },
  async run() {
    const outputs: Record<string, any> = {};

    // Import infra modules
    const secrets = await import("./infra/secrets");
    const neon = await import("./infra/neon");
    const api = await import("./infra/api");
    const web = await import("./infra/web");

    // Collect outputs
    if (api.outputs) Object.assign(outputs, api.outputs);
    if (web.outputs) Object.assign(outputs, web.outputs);

    return outputs;
  },
});
```

### Pattern 2: Conditional Streaming Handler

**What:** Export different Hono handlers for dev vs. production
**When to use:** When Lambda needs streaming (AI responses)
**Example:**

```typescript
// apps/server/src/lambda.ts
// Source: https://hono.dev/docs/getting-started/aws-lambda
import { handle, streamHandle } from "@hono/aws-lambda";
import { app } from "./app"; // Extract Hono app to shared module

// Streaming not supported in sst dev, use standard handler
export const handler = process.env.SST_DEV ? handle(app) : streamHandle(app);
```

### Pattern 3: Linkable for External Resources

**What:** Create sst.Linkable for non-SST-managed resources (Neon)
**When to use:** External databases, third-party services
**Example:**

```typescript
// infra/neon.ts
// Source: https://github.com/pauljasperdev/immo/blob/dev/infra/neon.ts
import { secrets } from "./secrets";

export const neon = new sst.Linkable("Neon", {
  properties: {
    url: secrets.DatabaseUrl.value,
    urlPooler: secrets.DatabaseUrlPooler.value,
  },
});
```

### Pattern 4: Secrets Organization

**What:** Central secrets file with all SST secrets
**When to use:** Always for secret management
**Example:**

```typescript
// infra/secrets.ts
// Source: https://sst.dev/docs/component/secret/

export const secrets = {
  DatabaseUrl: new sst.Secret("DatabaseUrl"),
  DatabaseUrlPooler: new sst.Secret("DatabaseUrlPooler"),
  BetterAuthSecret: new sst.Secret("BetterAuthSecret"),
  GoogleApiKey: new sst.Secret("GoogleApiKey"), // For AI SDK
};
```

### Anti-Patterns to Avoid

- **Importing SST SDK in app code**: Keep app code SST-agnostic; use t3-env for
  validation, SST injects env vars at deploy time
- **Using API Gateway for streaming**: API Gateway doesn't support streaming; use
  Function URL with CloudFront Router
- **Running `sst dev` with streaming enabled**: Streaming fails in dev mode; use
  conditional handler
- **Hardcoding stage-specific values**: Use `$app.stage` for stage-conditional config
- **Using pooled connection for migrations**: Use direct Neon URL for migrations,
  pooled URL for runtime queries

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                  | Don't Build           | Use Instead                         | Why                                                    |
| ------------------------ | --------------------- | ----------------------------------- | ------------------------------------------------------ |
| Secret management        | .env files on server  | `sst.Secret` + CLI                  | Encrypted, stage-isolated, type-safe                   |
| CloudFront routing       | Custom distribution   | `sst.aws.Router`                    | Handles caching, SSL, domains automatically            |
| Lambda streaming         | Custom response       | `streamHandle` from hono/aws-lambda | Handles AWS Lambda streaming protocol                  |
| Type-safe resource access| Manual env parsing    | `Resource` from sst SDK             | Auto-generated types, decryption handled               |
| DNS records              | Manual Cloudflare API | `sst.cloudflare.dns()` adapter      | Integrated with SST domain config                      |
| Next.js on Lambda        | Custom OpenNext setup | `sst.aws.Nextjs`                    | Handles server/edge functions, ISR, image optimization |

**Key insight:** SST components handle AWS complexity (IAM, permissions, networking)
that would take weeks to configure manually. Use built-in components over custom
Pulumi/Terraform resources.

## Common Pitfalls

### Pitfall 1: Streaming in `sst dev`

**What goes wrong:** Lambda streaming doesn't work when running `sst dev`
**Why it happens:** SST's live Lambda proxy doesn't support AWS streaming responses
**How to avoid:** Use conditional handler based on `SST_DEV` env var
**Warning signs:** AI chat responses hang or fail in local dev

```typescript
// Always check SST_DEV for streaming features
export const handler = process.env.SST_DEV ? handle(app) : streamHandle(app);
```

### Pitfall 2: Neon Pooled vs Direct Connection

**What goes wrong:** Migrations fail or leave connections hanging
**Why it happens:** Pooled connections use transaction mode, incompatible with DDL
**How to avoid:** Use direct URL for migrations, pooled URL for app queries
**Warning signs:** "prepared statement already exists" errors, migration hangs

```typescript
// infra/neon.ts - expose both URLs
export const neon = new sst.Linkable("Neon", {
  properties: {
    url: secrets.DatabaseUrl.value,          // Direct - for migrations
    urlPooler: secrets.DatabaseUrlPooler.value, // Pooled - for app
  },
});
```

### Pitfall 3: Cloudflare Account ID Missing

**What goes wrong:** Cloudflare DNS setup fails silently or with cryptic errors
**Why it happens:** SST docs say only API token needed, but account ID often required
**How to avoid:** Set both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_DEFAULT_ACCOUNT_ID`
**Warning signs:** "account ID required" errors during deploy

### Pitfall 4: `sst dev` Stubs Left Running

**What goes wrong:** Functions timeout when `sst dev` CLI is killed
**Why it happens:** Stub functions remain deployed, try to proxy to dead local machine
**How to avoid:** Run `sst deploy` after development to restore real functions
**Warning signs:** 30-second timeouts on all function invocations

### Pitfall 5: Missing Hono App Extraction

**What goes wrong:** Lambda handler can't import the Hono app
**Why it happens:** Current index.ts has app creation + serve() in same file
**How to avoid:** Extract Hono app to separate module, import in both entrypoints
**Warning signs:** Build errors about "serve not available in Lambda"

### Pitfall 6: t3-env Runtime Validation Timing

**What goes wrong:** Build fails because env vars not available at build time
**Why it happens:** t3-env validates on import; Next.js builds on server
**How to avoid:** SST injects env vars via `environment` prop; ensure build-time vars
  are available or use `skipValidation` during build
**Warning signs:** "Missing environment variable" during `next build`

## Code Examples

Verified patterns from official sources:

### Hono Lambda Entrypoint

```typescript
// apps/server/src/lambda.ts
// Source: https://sst.dev/docs/examples/#aws-hono-streaming
import { handle, streamHandle } from "@hono/aws-lambda";
import { app } from "./app";

// Use standard handler in dev (streaming not supported)
// Use streaming handler in production
export const handler = process.env.SST_DEV ? handle(app) : streamHandle(app);
```

### Hono App Module

```typescript
// apps/server/src/app.ts
// Extracted from current index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export const app = new Hono();

app.use(logger());
app.use("/*", cors({
  origin: process.env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ... routes
```

### Lambda Function with Router

```typescript
// infra/api.ts
// Source: https://sst.dev/docs/component/aws/router/
import { secrets } from "./secrets";
import { neon } from "./neon";

// Create Router for domain routing
export const router = new sst.aws.Router("Router", {
  domain: {
    name: $app.stage === "prod"
      ? "api.gemhog.com"
      : `api.${$app.stage}.gemhog.com`,
    dns: sst.cloudflare.dns({ zone: process.env.CLOUDFLARE_ZONE_ID }),
  },
});

// Hono Lambda with streaming
export const api = new sst.aws.Function("Api", {
  handler: "apps/server/src/lambda.handler",
  runtime: "nodejs22.x",
  streaming: !$dev,
  timeout: "15 minutes",
  url: {
    router: { instance: router },
    cors: {
      allowOrigins: ["https://gemhog.com", "https://*.gemhog.com"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowCredentials: true,
    },
  },
  link: [neon, secrets.BetterAuthSecret, secrets.GoogleApiKey],
  environment: {
    NODE_ENV: "production",
    CORS_ORIGIN: $app.stage === "prod"
      ? "https://gemhog.com"
      : `https://${$app.stage}.gemhog.com`,
    BETTER_AUTH_URL: $app.stage === "prod"
      ? "https://api.gemhog.com"
      : `https://api.${$app.stage}.gemhog.com`,
  },
});

export const outputs = {
  apiUrl: api.url,
};
```

### Next.js Component

```typescript
// infra/web.ts
// Source: https://sst.dev/docs/component/aws/nextjs/
import { secrets } from "./secrets";
import { neon } from "./neon";
import { api, router } from "./api";

export const web = new sst.aws.Nextjs("Web", {
  path: "apps/web",
  domain: {
    name: $app.stage === "prod"
      ? "gemhog.com"
      : `${$app.stage}.gemhog.com`,
    dns: sst.cloudflare.dns({ zone: process.env.CLOUDFLARE_ZONE_ID }),
  },
  link: [neon, secrets.BetterAuthSecret],
  environment: {
    NEXT_PUBLIC_SERVER_URL: $app.stage === "prod"
      ? "https://api.gemhog.com"
      : `https://api.${$app.stage}.gemhog.com`,
  },
});

export const outputs = {
  webUrl: web.url,
};
```

### Accessing Linked Resources at Runtime

```typescript
// In Lambda function (apps/server)
// Source: https://sst.dev/docs/linking/
import { Resource } from "sst";

// Access linked Neon database
const databaseUrl = Resource.Neon.urlPooler;

// Access linked secrets
const authSecret = Resource.BetterAuthSecret.value;
```

## State of the Art

| Old Approach              | Current Approach              | When Changed | Impact                          |
| ------------------------- | ----------------------------- | ------------ | ------------------------------- |
| SST v2 (CDK/CloudFormation)| SST v3 (Pulumi/Terraform)    | 2024         | Faster deploys, no circular refs|
| API Gateway + Lambda      | Function URL + Router         | SST v3       | Enables streaming responses     |
| Manual env vars           | Resource linking              | SST v3       | Type-safe, auto-permissions     |
| Seed CI/CD                | SST Console Autodeploy        | SST v3       | Built-in, no config files       |

**Deprecated/outdated:**

- `sst.aws.Api` for streaming: Use `sst.aws.Function` with URL + Router
- `Config.Secret` (v2): Use `sst.Secret` in v3
- Seed deployment: Not supported for SST v3; use Console or GitHub Actions

## Open Questions

Things that couldn't be fully resolved:

1. **Migration invocation timing**
   - What we know: Can use `aws.lambda.Invocation` to run migrations post-deploy
   - What's unclear: Exact ordering with SST Console autodeploy
   - Recommendation: Create migration Lambda, invoke conditionally outside $dev

2. **Cloudflare proxy settings via SST**
   - What we know: DNS records can be created, `proxy: true` option exists
   - What's unclear: Whether SST manages Cloudflare proxy or just DNS
   - Recommendation: Per CONTEXT.md, manage proxy settings in Cloudflare dashboard

3. **Personal stage domain routing**
   - What we know: Personal stages use `--stage <name>` (e.g., `--stage john`)
   - What's unclear: Whether personal stages should get subdomains
   - Recommendation: Skip domain for personal stages, use Function URL directly

## Sources

### Primary (HIGH confidence)

- [SST Nextjs Component](https://sst.dev/docs/component/aws/nextjs/) - path,
  environment, domain, link configuration
- [SST Function Component](https://sst.dev/docs/component/aws/function/) - handler,
  streaming, url configuration
- [SST Router Component](https://sst.dev/docs/component/aws/router/) - domain
  routing, CloudFront configuration
- [SST Secret Component](https://sst.dev/docs/component/secret/) - secret definition
  and linking
- [SST Linkable Component](https://sst.dev/docs/component/linkable/) - custom
  resource linking
- [SST Linking Documentation](https://sst.dev/docs/linking/) - Resource SDK, type
  safety
- [SST Cloudflare DNS](https://sst.dev/docs/component/cloudflare/dns/) - DNS adapter
  configuration
- [SST Monorepo Guide](https://sst.dev/docs/set-up-a-monorepo/) - infra/ folder
  pattern
- [SST Providers](https://sst.dev/docs/providers/) - Cloudflare provider setup
- [SST Live](https://sst.dev/docs/live/) - sst dev behavior, SST_DEV env var
- [SST Environment Variables](https://sst.dev/docs/environment-variables/) - env
  injection patterns
- [Hono AWS Lambda](https://hono.dev/docs/getting-started/aws-lambda) - handle vs
  streamHandle
- [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling) -
  pooler suffix, serverless best practices

### Secondary (MEDIUM confidence)

- [SST Monorepo Template](https://github.com/sst/monorepo-template) - real-world
  infra/ structure
- [Terminal.shop sst.config.ts](https://github.com/terminaldotshop/terminal) -
  production autodeploy, multi-provider setup
- [Neon Linkable Pattern](https://github.com/pauljasperdev/immo/blob/dev/infra/neon.ts)
  - custom Linkable for external DB
- [SST GitHub Issue #5064](https://github.com/sst/sst/issues/5064) - migration
  Lambda pattern

### Tertiary (LOW confidence)

- WebSearch for common SST pitfalls - manual verification recommended
- WebSearch for Cloudflare account ID requirement - GitHub issue confirmed

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - verified with official SST docs
- Architecture: HIGH - confirmed by monorepo template and terminal.shop
- Pitfalls: MEDIUM - some from GitHub issues, may vary by version

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (SST releases frequently; verify before major work)
