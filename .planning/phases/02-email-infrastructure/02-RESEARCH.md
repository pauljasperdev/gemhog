# Phase 2: Email Infrastructure - Research

**Researched:** 2026-01-27
**Domain:** AWS SES email sending, subscriber management, deliverability, compliance
**Confidence:** HIGH

## Summary

This phase implements email infrastructure for newsletter subscriber signup, verification (double opt-in), and unsubscribe flows using AWS SES. The project already uses SST v3 with Cloudflare DNS and has an established domain-driven architecture in `packages/core` with Effect TS services, Drizzle ORM schemas, and tRPC API routes.

The standard approach is: (1) use SST's `sst.aws.Email` component for domain verification and DKIM/SPF/DMARC setup, which automatically creates the necessary DNS records in Cloudflare; (2) use `@aws-sdk/client-sesv2` (AWS SDK v3) for sending emails, wrapped in Effect `tryPromise` for the service layer; (3) create a `subscriber` domain in `packages/core/src/subscriber/` following the existing auth domain pattern; (4) expose subscriber endpoints via tRPC public procedures; (5) implement double opt-in with crypto-signed verification tokens.

**Primary recommendation:** Use SST `sst.aws.Email` for infrastructure (DKIM/SPF automatic), `@aws-sdk/client-sesv2` wrapped in Effect for sending, Drizzle `pgEnum` for subscriber status tracking, and signed tokens (not DB-stored) for verification/unsubscribe links.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@aws-sdk/client-sesv2` | ^3.x (latest) | SES v2 API for sending email | Official AWS SDK v3, modular, tree-shakeable. SES v2 API supports Gmail/Yahoo one-click unsubscribe requirements |
| `sst.aws.Email` | SST v3 built-in | Domain verification, DKIM, configuration set | Handles DKIM CNAME records, DMARC TXT records, and SES identity automatically via Cloudflare DNS |
| `drizzle-orm` | ^0.45.1 (existing) | Subscriber schema and queries | Already in use, pgEnum for status tracking |
| `effect` | ^3.19 (existing) | Email service with DI and error handling | Already in use, wrap SES calls with Effect.tryPromise |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `aws-ses-v2-local` | ^2.9.0 | Local SES mock server for development | Dev/test only - intercepts SES API calls locally |
| `@effect/schema` or `zod` | existing | Input validation for subscriber endpoints | Validate email format, request payloads |
| Node.js `crypto` | built-in | HMAC-based verification tokens | Sign verification/unsubscribe links without DB lookup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@aws-sdk/client-sesv2` direct | `@effect-aws/client-ses` | Only wraps SES v1 API, not v2. SES v2 is required for Gmail/Yahoo compliance. Use direct SDK with Effect.tryPromise instead |
| Nodemailer with SES transport | `@aws-sdk/client-sesv2` direct | Nodemailer adds abstraction but also complexity and dependency. Direct SDK is simpler for raw SES usage in serverless |
| DB-stored verification tokens | HMAC-signed URL tokens | HMAC tokens are stateless, no DB lookup needed, expire naturally. Simpler and faster |

**Installation:**
```bash
pnpm add @aws-sdk/client-sesv2 --filter @gemhog/core
pnpm add -D aws-ses-v2-local --filter @gemhog/core
```

## Architecture Patterns

### Recommended Project Structure
```
packages/core/src/
├── subscriber/              # New subscriber domain
│   ├── subscriber.sql.ts    # Drizzle schema (subscriber table, pgEnum)
│   ├── subscriber.service.ts # Effect service (CRUD, status management)
│   ├── subscriber.errors.ts # TaggedErrors (SubscriberError, etc.)
│   ├── subscriber.mock.ts   # Mock layer for testing
│   ├── test-fixtures.ts     # Test helpers (truncation, factories)
│   ├── subscriber.test.ts   # Unit tests
│   ├── subscriber.int.test.ts # Integration tests
│   └── index.ts             # Barrel exports
├── email/                   # New email sending domain
│   ├── email.service.ts     # Effect service wrapping SES v2 client
│   ├── email.errors.ts      # TaggedErrors (EmailSendError, etc.)
│   ├── email.mock.ts        # Mock layer for testing (no real SES calls)
│   ├── email.templates.ts   # Email content builders (verification, welcome)
│   ├── email.test.ts        # Unit tests
│   └── index.ts             # Barrel exports
packages/api/src/routers/
├── subscriber.ts            # tRPC router for subscribe/verify/unsubscribe
infra/
├── email.ts                 # SST Email component configuration
```

### Pattern 1: Effect Service Wrapping AWS SDK
**What:** Wrap `@aws-sdk/client-sesv2` calls in Effect.tryPromise for typed error handling and dependency injection
**When to use:** All SES interactions from the email service
**Example:**
```typescript
// packages/core/src/email/email.service.ts
import { Context, Effect, Layer } from "effect";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailSendError } from "./email.errors";

export interface EmailService {
  readonly send: (params: {
    to: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
  }) => Effect.Effect<void, EmailSendError>;
}

export class EmailServiceTag extends Context.Tag("EmailService")<
  EmailServiceTag,
  EmailService
>() {}

// Production layer reads env vars (SST-agnostic)
export const EmailServiceLive = Layer.sync(EmailServiceTag, () => {
  const client = new SESv2Client({
    region: process.env.AWS_REGION ?? "eu-central-1",
  });
  const senderEmail = process.env.SES_FROM_EMAIL ?? "noreply@gemhog.com";

  return {
    send: ({ to, subject, html, headers }) =>
      Effect.tryPromise({
        try: () =>
          client.send(
            new SendEmailCommand({
              FromEmailAddress: senderEmail,
              Destination: { ToAddresses: [to] },
              Content: {
                Simple: {
                  Subject: { Data: subject },
                  Body: { Html: { Data: html } },
                  Headers: headers
                    ? Object.entries(headers).map(([name, value]) => ({
                        Name: name,
                        Value: value,
                      }))
                    : undefined,
                },
              },
            }),
          ),
        catch: (error) =>
          new EmailSendError({
            message: `Failed to send email to ${to}`,
            cause: error,
          }),
      }),
  };
});
```

### Pattern 2: HMAC-Signed Verification Tokens
**What:** Use Node.js crypto HMAC to create stateless, expiring verification/unsubscribe tokens
**When to use:** Verification links in double opt-in and unsubscribe URLs
**Example:**
```typescript
// packages/core/src/subscriber/token.ts
import { createHmac, timingSafeEqual } from "node:crypto";

interface TokenPayload {
  email: string;
  action: "verify" | "unsubscribe";
  expiresAt: number;
}

export function createToken(
  payload: TokenPayload,
  secret: string,
): string {
  const data = JSON.stringify(payload);
  const signature = createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  // Base64url encode: payload.signature
  return Buffer.from(`${data}.${signature}`).toString("base64url");
}

export function verifyToken(
  token: string,
  secret: string,
): TokenPayload | null {
  const decoded = Buffer.from(token, "base64url").toString();
  const lastDot = decoded.lastIndexOf(".");
  if (lastDot === -1) return null;

  const data = decoded.slice(0, lastDot);
  const signature = decoded.slice(lastDot + 1);

  const expected = createHmac("sha256", secret)
    .update(data)
    .digest("hex");

  if (
    !timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    )
  ) {
    return null;
  }

  const payload: TokenPayload = JSON.parse(data);
  if (Date.now() > payload.expiresAt) return null;

  return payload;
}
```

### Pattern 3: Subscriber Status Machine
**What:** Track subscriber lifecycle via pgEnum status column
**When to use:** All subscriber state transitions
**States:**
- `pending` - Signed up, verification email sent, awaiting confirmation
- `active` - Verified via double opt-in, receiving emails
- `unsubscribed` - Opted out via unsubscribe link

### Pattern 4: SST Email Infrastructure (infra/email.ts)
**What:** SST `sst.aws.Email` component with Cloudflare DNS for automatic DKIM/SPF setup
**When to use:** Infrastructure provisioning
**Example:**
```typescript
// infra/email.ts
import { secrets } from "./secrets";

export const email = new sst.aws.Email("Email", {
  sender: "gemhog.com",
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
  dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;",
});
```

### Pattern 5: List-Unsubscribe Headers (RFC 8058)
**What:** Include `List-Unsubscribe` and `List-Unsubscribe-Post` headers for one-click unsubscribe
**When to use:** Every marketing/newsletter email sent
**Example:**
```typescript
// When sending email, include headers:
const unsubscribeUrl = `https://gemhog.com/api/unsubscribe?token=${token}`;
const headers = {
  "List-Unsubscribe": `<${unsubscribeUrl}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
};
```

### Anti-Patterns to Avoid
- **Importing SST SDK in application code:** Application code must read env vars only. The SES client reads `AWS_REGION` and `SES_FROM_EMAIL` from environment, not from `Resource.MyEmail.sender`.
- **Storing verification tokens in the database:** HMAC-signed tokens are stateless and don't require DB storage or cleanup. Avoid a `verification_tokens` table.
- **Using SES v1 API:** SES v2 API is required for compliance with Gmail/Yahoo one-click unsubscribe requirements.
- **Proxying DKIM CNAME records through Cloudflare:** DKIM records MUST be "DNS only" (gray cloud). Cloudflare proxy will break DKIM verification.
- **Sending to unverified emails in sandbox:** SES sandbox only allows sending to verified addresses. Test with verified emails or request production access.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DKIM/SPF/DMARC DNS records | Manual DNS record creation | `sst.aws.Email` with `sst.cloudflare.dns()` | SST creates all 3 DKIM CNAMEs, DMARC TXT, and SPF records automatically |
| Email HTML templating | Complex template engine | Simple string template functions | V1 only needs verification + unsubscribe emails. Inline template strings suffice. No need for mjml/react-email yet |
| Token signing | Custom crypto implementation | Node.js `crypto.createHmac` | Built-in, secure, no dependencies needed |
| Email validation | Regex-based validation | Zod `.email()` schema | Already using Zod, handles edge cases properly |
| Rate limiting | Custom rate limiter | SES built-in sending rate limits | SES enforces sending quotas (200/day sandbox, 50k/day production). App-level rate limiting can come later |

**Key insight:** The SST `sst.aws.Email` component handles the most complex part of email infrastructure (DNS verification, DKIM key generation, configuration sets) automatically. Don't manually create SES identities or DNS records.

## Common Pitfalls

### Pitfall 1: SES Sandbox Mode
**What goes wrong:** Emails fail to send because SES is in sandbox mode, which only allows sending to verified email addresses
**Why it happens:** All new AWS accounts start in SES sandbox. Production access must be explicitly requested.
**How to avoid:** Request production access early in the process. In the meantime, verify test recipient emails in the SES console. Document sandbox limitations for the team.
**Warning signs:** `MessageRejected` errors when sending to non-verified addresses

### Pitfall 2: Cloudflare Proxy on DKIM Records
**What goes wrong:** DKIM verification fails even though DNS records are correct
**Why it happens:** Cloudflare's proxy (orange cloud) intercepts DNS lookups and breaks DKIM CNAME resolution. DKIM records MUST use "DNS only" (gray cloud).
**How to avoid:** SST's `sst.cloudflare.dns()` adapter handles this correctly. If debugging, check Cloudflare dashboard that DKIM CNAMEs show gray cloud icon.
**Warning signs:** SES shows "Pending" for DKIM verification for more than 72 hours

### Pitfall 3: Missing MAIL FROM Domain for SPF Alignment
**What goes wrong:** SPF passes but doesn't align with the From domain, potentially affecting deliverability
**Why it happens:** Without a custom MAIL FROM domain, SES uses `amazonses.com` as the bounce domain, which doesn't match your sending domain
**How to avoid:** SST's Email component with domain verification handles this. You can also set a custom MAIL FROM subdomain (e.g., `mail.gemhog.com`) in SES for full SPF alignment.
**Warning signs:** DMARC reports show SPF alignment failures

### Pitfall 4: Not Handling Bounces and Complaints
**What goes wrong:** Bounce/complaint rates exceed SES thresholds (>5% bounce, >0.1% complaint), leading to account suspension
**Why it happens:** No monitoring of delivery feedback. Continuing to send to invalid addresses.
**How to avoid:** Use the SES configuration set from `sst.aws.Email` to track delivery events. For V1, monitor via CloudWatch metrics. Remove bounced addresses from the subscriber list.
**Warning signs:** Rising bounce rate in SES dashboard, SES sending pause notifications

### Pitfall 5: Verification Link Expiry Too Short/Long
**What goes wrong:** Too short (< 1 hour) and users miss the window. Too long (> 7 days) and it becomes a security concern.
**How to avoid:** Set verification token expiry to 24-48 hours. This gives users enough time while limiting exposure.
**Warning signs:** High rate of expired verification attempts

### Pitfall 6: SST-Agnostic Code Violation
**What goes wrong:** Application code imports `sst` or `Resource` from the SST SDK, breaking local development and test
**Why it happens:** SST's tutorial examples use `Resource.MyEmail.sender` which requires SST runtime context
**How to avoid:** Application code reads `process.env.SES_FROM_EMAIL` and `process.env.AWS_REGION`. SST injects these as environment variables in `infra/web.ts` and `infra/email.ts`.
**Warning signs:** Imports from `sst` in `packages/core/` or `packages/api/`

### Pitfall 7: Forgetting List-Unsubscribe-Post Header
**What goes wrong:** Gmail/Yahoo don't show one-click unsubscribe button, potentially hurting deliverability
**Why it happens:** Only including `List-Unsubscribe` without the corresponding `List-Unsubscribe-Post` header
**How to avoid:** Always include both headers together. The `List-Unsubscribe-Post` value is always the literal string `List-Unsubscribe=One-Click` (per RFC 8058).
**Warning signs:** No unsubscribe button visible in Gmail header area

## Code Examples

Verified patterns from official sources and project conventions:

### Subscriber Drizzle Schema
```typescript
// packages/core/src/subscriber/subscriber.sql.ts
// Source: Drizzle ORM pgEnum docs + project auth.sql.ts pattern
import { pgEnum, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "pending",
  "active",
  "unsubscribed",
]);

export const subscriber = pgTable(
  "subscriber",
  {
    id: text("id").primaryKey(), // nanoid or cuid
    email: text("email").notNull().unique(),
    status: subscriberStatusEnum("status").notNull().default("pending"),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    verifiedAt: timestamp("verified_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscriber_email_idx").on(table.email),
    index("subscriber_status_idx").on(table.status),
  ],
);
```

### Send Verification Email
```typescript
// packages/core/src/email/email.templates.ts
export function verificationEmail(params: {
  verifyUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Confirm your Gemhog subscription",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to Gemhog</h1>
        <p>Thanks for signing up! Please confirm your subscription by clicking the button below.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${params.verifyUrl}"
             style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Confirm Subscription
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't sign up for Gemhog, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          This link expires in 48 hours.
        </p>
      </div>
    `,
  };
}
```

### tRPC Subscribe Endpoint
```typescript
// packages/api/src/routers/subscriber.ts
import { z } from "zod";
import { publicProcedure, router } from "../index";

export const subscriberRouter = router({
  subscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      // 1. Create subscriber with status "pending"
      // 2. Generate HMAC verification token
      // 3. Send verification email via EmailService
      // 4. Return success (don't reveal if email already exists)
    }),
});
```

### Unsubscribe API Route (for one-click POST)
```typescript
// apps/web/src/app/api/unsubscribe/route.ts
// RFC 8058 requires a POST endpoint that accepts the unsubscribe request
// This is a Next.js API route (not tRPC) because email clients POST directly
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  // 1. Verify HMAC token
  // 2. Update subscriber status to "unsubscribed"
  // 3. Return 200 OK
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  // 1. Verify HMAC token
  // 2. Show unsubscribe confirmation page
  // 3. On confirmation, POST to same endpoint
}
```

### SST Infrastructure for Email
```typescript
// infra/email.ts
import { secrets } from "./secrets";

export const email = new sst.aws.Email("Email", {
  sender: "gemhog.com",
  dns: sst.cloudflare.dns({
    zone: secrets.CloudflareZoneId.value,
  }),
  dmarc: "v=DMARC1; p=quarantine; adkim=s; aspf=s;",
});

// Export sender and config for web environment
export const emailConfig = {
  sender: email.sender,
  configSet: email.configSet,
};
```

### Environment Variable Wiring
```typescript
// infra/web.ts - add to existing environment block:
// SES_FROM_EMAIL: `noreply@${email.sender}`,
// SES_CONFIG_SET: email.configSet,
// SUBSCRIBER_TOKEN_SECRET: secrets.SubscriberTokenSecret.value,
// APP_URL: $dev ? "http://localhost:3001" : `https://${domain}`,

// packages/env/src/server.ts - add new env vars:
// SES_FROM_EMAIL: z.string().email(),
// SES_CONFIG_SET: z.string().optional(),
// SUBSCRIBER_TOKEN_SECRET: z.string().min(32),
// APP_URL: z.url(),
```

### Effect Error Types
```typescript
// packages/core/src/email/email.errors.ts
import { Data } from "effect";

export class EmailSendError extends Data.TaggedError("EmailSendError")<{
  message: string;
  cause?: unknown;
}> {}

export class EmailConfigError extends Data.TaggedError("EmailConfigError")<{
  message: string;
}> {}

// packages/core/src/subscriber/subscriber.errors.ts
import { Data } from "effect";

export class SubscriberError extends Data.TaggedError("SubscriberError")<{
  message: string;
  cause?: unknown;
}> {}

export class SubscriberNotFoundError extends Data.TaggedError(
  "SubscriberNotFoundError",
)<{
  email: string;
}> {}

export class InvalidTokenError extends Data.TaggedError("InvalidTokenError")<{
  reason: "expired" | "invalid_signature" | "malformed";
}> {}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SES v1 API (`@aws-sdk/client-ses`) | SES v2 API (`@aws-sdk/client-sesv2`) | SES v2 released 2020, recommended for new projects | v2 required for Gmail/Yahoo one-click unsubscribe compliance (June 2024) |
| Manual SES identity + DNS setup | SST `sst.aws.Email` component | SST v3 (2024) | Automatic DKIM/SPF/DMARC record creation, managed configuration sets |
| `mailto:` List-Unsubscribe | HTTPS URI + `List-Unsubscribe-Post` (RFC 8058) | Gmail/Yahoo requirement June 2024 | `mailto:` alone no longer compliant for bulk senders |
| DB-stored verification tokens | HMAC-signed stateless tokens | Best practice | No token table needed, no cleanup cron, no DB lookup on verify |

**Deprecated/outdated:**
- `@aws-sdk/client-ses` (v1 API): Still works but SES v2 API is recommended for new projects and required for modern inbox provider compliance
- `mailto:` List-Unsubscribe without HTTPS: Gmail and Yahoo now require HTTPS URI method for one-click unsubscribe

## Open Questions

Things that couldn't be fully resolved:

1. **SES Sandbox vs Production Access Timing**
   - What we know: New AWS accounts start in SES sandbox (200 emails/day, verified recipients only). Production access requires a support request with use case description, takes ~24 hours.
   - What's unclear: Whether the dev/test stage AWS account already has production SES access, or if a request needs to be filed.
   - Recommendation: Plan for sandbox mode initially. Include a task to request production access. Verification/testing works fine in sandbox with verified test emails.

2. **SES `SendEmail` Headers API for List-Unsubscribe**
   - What we know: SES v2 `SendEmailCommand` with `Simple` content type supports a `Headers` array. RFC 8058 requires `List-Unsubscribe` and `List-Unsubscribe-Post` headers.
   - What's unclear: Whether the `Headers` field in SES v2 `Simple` content type supports custom headers like `List-Unsubscribe`, or if `Raw` content type is required.
   - Recommendation: Test with `Simple` content type first. If headers are not supported, fall back to `Raw` email content type with full MIME construction. The `Raw` approach gives full control over headers.

3. **Custom MAIL FROM Domain for Full SPF Alignment**
   - What we know: SST `sst.aws.Email` handles domain verification and DKIM. SPF alignment requires a custom MAIL FROM domain (e.g., `mail.gemhog.com`).
   - What's unclear: Whether SST's Email component automatically sets up a custom MAIL FROM domain, or if this needs manual SES console configuration.
   - Recommendation: Start without custom MAIL FROM (SES default `amazonses.com` still passes SPF, just not aligned). Add custom MAIL FROM as an enhancement if DMARC reports show alignment issues.

4. **`aws-ses-v2-local` Compatibility with Lambda Runtime**
   - What we know: `aws-ses-v2-local` runs as a local HTTP server that mimics the SES v2 API. The SES client can be configured with a custom endpoint.
   - What's unclear: Whether it's better to use `aws-ses-v2-local` or just mock the Effect email service layer in tests.
   - Recommendation: Use Effect mock layers for unit/integration tests (consistent with existing patterns). Use `aws-ses-v2-local` only if end-to-end email flow testing is needed during development. This avoids adding a dev dependency to the test infrastructure.

## Sources

### Primary (HIGH confidence)
- [SST Email Component Docs](https://sst.dev/docs/component/aws/email/) - Constructor args, properties, linking, DNS adapter
- [SST Email Tutorial](https://sst.dev/docs/start/aws/email/) - Step-by-step setup with SST v3
- [SST Cloudflare DNS Adapter](https://sst.dev/docs/component/cloudflare/dns/) - Zone ID parameter, proxy settings
- [AWS SES v2 SendEmail](https://docs.aws.amazon.com/ses/latest/dg/sesv2_example_sesv2_SendEmail_section.html) - Official SDK examples
- [@aws-sdk/client-sesv2 npm](https://www.npmjs.com/package/@aws-sdk/client-sesv2) - Installation, API usage
- [Drizzle ORM pgEnum](https://orm.drizzle.team/docs/column-types/pg) - PostgreSQL enum type definition
- [AWS SES Easy DKIM](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html) - 2048-bit DKIM key setup
- [AWS SES Creating Identities](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html) - Domain and email verification
- [AWS SES Production Access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) - Sandbox removal process
- [RFC 8058](https://datatracker.ietf.org/doc/html/rfc8058) - One-Click Unsubscribe specification

### Secondary (MEDIUM confidence)
- [AWS SES DMARC Compliance](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html) - SPF + DKIM + DMARC together
- [Cloudflare DKIM Issues with SES](https://community.cloudflare.com/t/email-dkim-setup-failure-with-amazon-ses/207236) - DNS-only requirement for DKIM CNAMEs
- [Mailgun RFC 8058 Explainer](https://www.mailgun.com/blog/deliverability/what-is-rfc-8058/) - Gmail/Yahoo requirement details
- [Postmark List-Unsubscribe Guide](https://postmarkapp.com/support/article/1299-how-to-include-a-list-unsubscribe-header) - Header format examples
- [aws-ses-v2-local](https://github.com/domdomegg/aws-ses-v2-local) - Local SES mock server

### Tertiary (LOW confidence)
- `@effect-aws/client-ses` existence on npm - Only SES v1 wrapper exists, no SES v2 wrapper found. Wrap `@aws-sdk/client-sesv2` directly with Effect.tryPromise instead.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - AWS SDK v3, SST Email component, and Drizzle ORM are all well-documented with official sources
- Architecture: HIGH - Follows established domain-driven patterns already in the codebase (auth domain reference)
- Pitfalls: HIGH - SES sandbox, Cloudflare proxy, and RFC 8058 requirements are well-documented across multiple official sources
- Email compliance: HIGH - CAN-SPAM and GDPR requirements are well-established legal standards
- Effect integration: MEDIUM - No official Effect-AWS SES v2 wrapper; Effect.tryPromise pattern is standard but the specific SES v2 wrapping is project-specific

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable domain, AWS SES API rarely changes)
