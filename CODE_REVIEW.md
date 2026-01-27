I reviewed your code and have the following comments. Please address them.

Comment types: ISSUE (problems to fix), SUGGESTION (improvements), NOTE
(observations), PRAISE (positive feedback)

1. **[ISSUE]** `.planning/STATE.md:68` - what is the issue? i dont want any
   tests to fail. if test cannot be completed due to missing env that is a
   blocker and has to be fixed by human
2. **[SUGGESTION]** `apps/web/.env.example:13` - should the subscriber token
   better be a hash of the email so its not static and we recreate in in the
   validate to check. it can leak then and we dont need another env var
3. **[SUGGESTION]** `apps/web/package.json:28` - we should add effect to catalog
   an remove everywhere its used
4. **[ISSUE]** `apps/web/src/app/api/subscribe/route.ts:14` - we shoudl use trpc
   endpoint not enxt route
5. **[ISSUE]** `apps/web/src/app/api/subscribe/route.ts:17` - we dont use nextjs
   routes. we have a trpc endpoint and should make a router for subscriber
6. **[NOTE]** `apps/web/src/app/api/unsubscribe/route.ts:7` - no need for dev
   secret when we make this a hash
7. **[ISSUE]** `apps/web/src/app/api/unsubscribe/route.ts:11` - we dont use next
   router we make trpc router for subscribe
8. **[ISSUE]** `infra/api.ts:27` - in sst dev we should still use real domain.
   $dev mean running in sst dev
9. **[NOTE]** `infra/secrets.ts:8` - can be removed with hash
10. **[NOTE]** `packages/core/src/email/email.service.ts:27` - this whole block
    looks horrible
11. **[NOTE]** `packages/core/src/email/email.service.ts:30` - this is not very
    effecty. if you log use Console.log from effect. then i dont think you do it
    inline rather trough pipe
12. **[SUGGESTION]** `packages/core/src/email/email.service.ts:40` - hardocde
    region. do not ever use process.env we have a env package for a reason. to
    make this env stuff save tand this is not safe
13. **[NOTE]** `packages/core/src/email/email.service.ts:66` - as we have sentry
    in place now, we should start trancing this trough traces and spans for
    which effect is very good. this goes for all code. this should also be
    mentioned in the docs at conventions or something so that gsd executioner
    finds it
14. **[ISSUE]** `packages/core/src/email/subscriber.service.ts:58` - dont nest
    if statements
15. **[NOTE]** `packages/core/src/email/subscriber.service.ts:100` - this is not
    effect code. we do happy path coding and error are propageated to parent.
    this should be 'thrown' prior and not be here
16. **[NOTE]** `packages/core/src/email/subscriber.service.ts:113` - same here.
    this is async await style code, but not effectish
17. **[NOTE]** `packages/core/src/email/subscriber.service.ts:117` - this should
    all be abstracted into effects, which can then fail so we dont see the
    failure here
18. **[NOTE]** `packages/core/src/email/subscriber.sql.ts:12` - for the ids we
    could also use something like this in our project import { generatePublicId
    } from '../public-id';

export const property = pgTable( 'property', { id: bigserial('id', { mode:
'number' }).primaryKey(), publicId: varchar('public_id', { length: 12 })
.notNull() .unique() .default(generatePublicId()),

      import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'; const length = 12;

const nanoid = customAlphabet(alphabet, length);

export function generatePublicId() { return nanoid(); }

maybe this can be done better. this makes very fast lookups trough big int and
prevents exposing internal id in route for example 19. **[NOTE]**
`packages/core/src/email/test-fixtures.ts:8` - i think we should move all tests
and its files in a domain to a folder tests/ otherwise the implementain files
are so diluted by test files. then we sill have it colocated but a bit more
seperate. this should be done for the whole project 20. **[NOTE]**
`packages/core/src/email/token.ts:17` - ah i sees now we do hash this. makes
sense. very good 21. **[ISSUE]** `packages/core/src/email/token.ts:37` - this is
not very effectish again. we loose context when we catch all exceptions in that
we throw. every error should be a effect error which can be handled upstream 22.
**[NOTE]** `packages/core/src/email/token.ts:53` - make effect error for those

23. pnpm tests fails cope: 6 of 7 workspace projects packages/core check-types$
    tsc --noEmit └─ Done in 2.3s apps/server check-types$ tsc -b └─ Done in 1.4s
    OK static

=== Unit Tests ===

RUN v4.0.18 /Users/paul/dev/lima-repo

✓ @gemhog/api src/routers/procedures.int.test.ts (3 tests) 3ms ✓ @gemhog/api
src/context.test.ts (1 test) 28ms ✓ @gemhog/core src/auth/schema.int.test.ts (8
tests) 160ms ✓ @gemhog/core src/email/subscriber.test.ts (10 tests) 9ms ❯
@gemhog/core src/email/subscriber.int.test.ts (10 tests | 10 failed) 246ms ×
creates a new subscriber with pending status 56ms × returns isNew: false for
duplicate pending email 19ms × returns isNew: false for duplicate active email
(silent success) 18ms × transitions from pending to active 20ms × transitions
through all states 19ms × resets to pending with isNew: true 22ms × fails with
SubscriberNotFoundError for nonexistent email 34ms × fails with
SubscriberNotFoundError for nonexistent email 20ms × returns null for
nonexistent email 19ms × returns subscriber when found 18ms ✓ @gemhog/core
src/email/token.test.ts (10 tests) 6ms stderr | src/auth/auth.int.test.ts > auth
integration > signin > should reject invalid password 2026-01-27T18:57:03.896Z
ERROR [Better Auth]: Invalid password

stderr | src/auth/auth.int.test.ts > auth integration > signin > should reject
non-existent user 2026-01-27T18:57:03.982Z ERROR [Better Auth]: User not found {
email: 'nonexistent@example.com' }

✓ @gemhog/core src/auth/auth.int.test.ts (5 tests) 946ms ✓ @gemhog/core
src/email/email.service.test.ts (4 tests) 7ms ✓ @gemhog/core
src/drizzle/migrations.int.test.ts (2 tests) 77ms ✓ @gemhog/core
src/email/email.templates.test.ts (10 tests) 2ms ✓ @gemhog/core
src/drizzle/connection.int.test.ts (2 tests) 40ms ✓ @gemhog/core
src/auth/auth.test.ts (2 tests) 1ms stderr | src/server.test.ts > server env
validation > missing required vars > should fail when DATABASE_URL is missing ❌
Invalid environment variables: [ { expected: 'string', code: 'invalid_type',
path: [ 'DATABASE_URL' ], message: 'Invalid input: expected string, received
undefined' }, { expected: 'string', code: 'invalid_type', path: [
'DATABASE_URL_POOLER' ], message: 'Invalid input: expected string, received
undefined' }, { expected: 'string', code: 'invalid_type', path: [
'BETTER_AUTH_SECRET' ], message: 'Invalid input: expected string, received
undefined' }, { expected: 'string', code: 'invalid_type', path: [
'BETTER_AUTH_URL' ], message: 'Invalid input: expected string, received
undefined' }, { expected: 'string', code: 'invalid_type', path: [ 'APP_URL' ],
message: 'Invalid input: expected string, received undefined' }, { expected:
'string', code: 'invalid_type', path: [ 'GOOGLE_GENERATIVE_AI_API_KEY' ],
message: 'Invalid input: expected string, received undefined' } ]

stderr | src/server.test.ts > server env validation > missing required vars >
should fail when BETTER_AUTH_SECRET is missing ❌ Invalid environment variables:
[ { expected: 'string', code: 'invalid_type', path: [ 'DATABASE_URL' ], message:
'Invalid input: expected string, received undefined' }, { expected: 'string',
code: 'invalid_type', path: [ 'DATABASE_URL_POOLER' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_SECRET' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_URL' ], message: 'Invalid input: expected
string, received undefined' }, { expected: 'string', code: 'invalid_type', path:
[ 'APP_URL' ], message: 'Invalid input: expected string, received undefined' },
{ expected: 'string', code: 'invalid_type', path: [
'GOOGLE_GENERATIVE_AI_API_KEY' ], message: 'Invalid input: expected string,
received undefined' } ]

stderr | src/server.test.ts > server env validation > missing required vars >
should fail when BETTER_AUTH_URL is missing ❌ Invalid environment variables: [
{ expected: 'string', code: 'invalid_type', path: [ 'DATABASE_URL' ], message:
'Invalid input: expected string, received undefined' }, { expected: 'string',
code: 'invalid_type', path: [ 'DATABASE_URL_POOLER' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_SECRET' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_URL' ], message: 'Invalid input: expected
string, received undefined' }, { expected: 'string', code: 'invalid_type', path:
[ 'APP_URL' ], message: 'Invalid input: expected string, received undefined' },
{ expected: 'string', code: 'invalid_type', path: [
'GOOGLE_GENERATIVE_AI_API_KEY' ], message: 'Invalid input: expected string,
received undefined' } ]

stderr | src/server.test.ts > server env validation > missing required vars >
should fail when APP_URL is missing ❌ Invalid environment variables: [ {
expected: 'string', code: 'invalid_type', path: [ 'DATABASE_URL' ], message:
'Invalid input: expected string, received undefined' }, { expected: 'string',
code: 'invalid_type', path: [ 'DATABASE_URL_POOLER' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_SECRET' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_URL' ], message: 'Invalid input: expected
string, received undefined' }, { expected: 'string', code: 'invalid_type', path:
[ 'APP_URL' ], message: 'Invalid input: expected string, received undefined' },
{ expected: 'string', code: 'invalid_type', path: [
'GOOGLE_GENERATIVE_AI_API_KEY' ], message: 'Invalid input: expected string,
received undefined' } ]

stderr | src/server.test.ts > server env validation > missing required vars >
should fail when GOOGLE_GENERATIVE_AI_API_KEY is missing ❌ Invalid environment
variables: [ { expected: 'string', code: 'invalid_type', path: [ 'DATABASE_URL'
], message: 'Invalid input: expected string, received undefined' }, { expected:
'string', code: 'invalid_type', path: [ 'DATABASE_URL_POOLER' ], message:
'Invalid input: expected string, received undefined' }, { expected: 'string',
code: 'invalid_type', path: [ 'BETTER_AUTH_SECRET' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_URL' ], message: 'Invalid input: expected
string, received undefined' }, { expected: 'string', code: 'invalid_type', path:
[ 'APP_URL' ], message: 'Invalid input: expected string, received undefined' },
{ expected: 'string', code: 'invalid_type', path: [
'GOOGLE_GENERATIVE_AI_API_KEY' ], message: 'Invalid input: expected string,
received undefined' } ]

stderr | src/server.test.ts > server env validation > missing required vars >
should fail when DATABASE_URL_POOLER is missing ❌ Invalid environment
variables: [ { expected: 'string', code: 'invalid_type', path: [ 'DATABASE_URL'
], message: 'Invalid input: expected string, received undefined' }, { expected:
'string', code: 'invalid_type', path: [ 'DATABASE_URL_POOLER' ], message:
'Invalid input: expected string, received undefined' }, { expected: 'string',
code: 'invalid_type', path: [ 'BETTER_AUTH_SECRET' ], message: 'Invalid input:
expected string, received undefined' }, { expected: 'string', code:
'invalid_type', path: [ 'BETTER_AUTH_URL' ], message: 'Invalid input: expected
string, received undefined' }, { expected: 'string', code: 'invalid_type', path:
[ 'APP_URL' ], message: 'Invalid input: expected string, received undefined' },
{ expected: 'string', code: 'invalid_type', path: [
'GOOGLE_GENERATIVE_AI_API_KEY' ], message: 'Invalid input: expected string,
received undefined' } ]

stderr | src/server.test.ts > server env validation > optional SES*FROM_EMAIL >
should fail with an invalid SES_FROM_EMAIL ❌ Invalid environment variables: [ {
origin: 'string', code: 'invalid_format', format: 'email', pattern:
"/^(?!\\.)(?!.\*\\.\\.)([A-Za-z0-9*'+\\-\\.]_)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]_\\.)+[A-Za-z]{2,}$/",
path: [ 'SES_FROM_EMAIL' ], message: 'Invalid email address' } ]

stderr | src/server.test.ts > server env validation > optional
SUBSCRIBER_TOKEN_SECRET > should fail with a short SUBSCRIBER_TOKEN_SECRET (< 32
chars) ❌ Invalid environment variables: [ { origin: 'string', code:
'too_small', minimum: 32, inclusive: true, path: [ 'SUBSCRIBER_TOKEN_SECRET' ],
message: 'Too small: expected string to have >=32 characters' } ]

✓ @gemhog/env src/server.test.ts (20 tests) 48ms stderr | src/web.test.ts > web
env validation > required vars > should fail when NEXT_PUBLIC_SERVER_URL is
missing ❌ Invalid environment variables: [ { expected: 'string', code:
'invalid_type', path: [ 'NEXT_PUBLIC_SERVER_URL' ], message: 'Invalid input:
expected string, received undefined' } ]

stderr | src/web.test.ts > web env validation > required vars > should fail when
NEXT_PUBLIC_SERVER_URL is empty string ❌ Invalid environment variables: [ {
expected: 'string', code: 'invalid_type', path: [ 'NEXT_PUBLIC_SERVER_URL' ],
message: 'Invalid input: expected string, received undefined' } ]

stderr | src/web.test.ts > web env validation > required vars > should fail when
NEXT_PUBLIC_SERVER_URL is not a valid URL ❌ Invalid environment variables: [ {
code: 'invalid_format', format: 'url', path: [ 'NEXT_PUBLIC_SERVER_URL' ],
message: 'Invalid URL' } ]

✓ @gemhog/env src/web.test.ts (8 tests) 26ms ✓ server src/startup.int.test.ts (6
tests) 5447ms ✓ should succeed with .env.example configuration 1096ms ✓ should
fail when DATABASE_URL is missing 1216ms ✓ should fail when DATABASE_URL_POOLER
is missing 824ms ✓ should fail when BETTER_AUTH_SECRET is missing 764ms ✓ should
fail when BETTER_AUTH_URL is missing 762ms ✓ should fail when APP_URL is missing
783ms ✓ web src/app/api/unsubscribe/route.test.ts (6 tests) 16ms ✓ web
src/app/api/verify/route.test.ts (4 tests) 15ms ✓ web
src/app/api/subscribe/route.test.ts (5 tests) 14ms ✓ web src/dev.int.test.ts (1
test) 4905ms ✓ starts with repo defaults 4904ms ✓ web src/startup.int.test.ts (2
tests) 47445ms ✓ should succeed with .env.example configuration 17763ms ✓ should
succeed with OpenNext build 29680ms ✓ web src/app/api/trpc/[trpc]/route.test.ts
(1 test) 1ms ✓ web src/app/api/auth/[...all]/route.test.ts (1 test) 1ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 10
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > subscribe > creates a new subscriber with pending status
(FiberFailure) SubscriberError: Failed to find subscriber: new@example.com ❯
Object.onFailure src/email/subscriber.service.ts:45:15 43|
Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^ 46|
message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > subscribe > returns isNew: false for duplicate pending email
(FiberFailure) SubscriberError: Failed to find subscriber: dup@example.com ❯
Object.onFailure src/email/subscriber.service.ts:45:15 43|
Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^ 46|
message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > subscribe > returns isNew: false for duplicate active email
(silent success) (FiberFailure) SubscriberError: Failed to find subscriber:
active@example.com ❯ Object.onFailure src/email/subscriber.service.ts:45:15 43|
Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^ 46|
message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > full subscribe -> verify lifecycle > transitions from pending to
active (FiberFailure) SubscriberError: Failed to find subscriber:
lifecycle@example.com ❯ Object.onFailure src/email/subscriber.service.ts:45:15
43| Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^
46| message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > full subscribe -> verify -> unsubscribe lifecycle > transitions
through all states (FiberFailure) SubscriberError: Failed to find subscriber:
full@example.com ❯ Object.onFailure src/email/subscriber.service.ts:45:15 43|
Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^ 46|
message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > re-subscribe after unsubscribe > resets to pending with isNew:
true (FiberFailure) SubscriberError: Failed to find subscriber:
resub@example.com ❯ Object.onFailure src/email/subscriber.service.ts:45:15 43|
Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^ 46|
message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > verify > fails with SubscriberNotFoundError for nonexistent email
AssertionError: expected SubscriberError: Failed to find subscribe… { \_tag: '…'
} to be an instance of SubscriberNotFoundError ❯
src/email/subscriber.int.test.ts:207:29 205| expect(result.\_tag).toBe("Left");
206| if (result.\_tag === "Left") { 207|
expect(result.left).toBeInstanceOf(SubscriberNotFoundError); | ^ 208| } 209| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > unsubscribe > fails with SubscriberNotFoundError for nonexistent
email AssertionError: expected SubscriberError: Failed to find subscribe… {
\_tag: '…' } to be an instance of SubscriberNotFoundError ❯
src/email/subscriber.int.test.ts:227:29 225| expect(result.\_tag).toBe("Left");
226| if (result.\_tag === "Left") { 227|
expect(result.left).toBeInstanceOf(SubscriberNotFoundError); | ^ 228| } 229| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > findByEmail > returns null for nonexistent email (FiberFailure)
SubscriberError: Failed to find subscriber: nobody@example.com ❯
Object.onFailure src/email/subscriber.service.ts:45:15 43|
Effect.catchAll((error) => 44| Effect.fail( 45| new SubscriberError({ | ^ 46|
message: `Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/10]⎯

FAIL @gemhog/core src/email/subscriber.int.test.ts > subscriber service
integration > findByEmail > returns subscriber when found (FiberFailure)
SubscriberError: Failed to find subscriber: find@example.com ❯ Object.onFailure
src/email/subscriber.service.ts:45:15 43| Effect.catchAll((error) => 44|
Effect.fail( 45| new SubscriberError({ | ^ 46| message:
`Failed to find subscriber: ${email}`, 47| cause: error, ❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/core.js:453:22
❯
../../node_modules/.pnpm/effect@3.19.15/node_modules/effect/dist/esm/internal/fiberRuntime.js:979:46

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/10]⎯

Test Files 1 failed | 21 passed (22) Tests 10 failed | 111 passed (121) Start at
19:56:59 Duration 67.12s (transform 236ms, setup 0ms, import 4.84s, tests
59.44s, environment 338ms)

 ELIFECYCLE  Test failed. See above for more details.

 paul  …/lima-repo   dev +?⇡   v25.2.1   19:58  

