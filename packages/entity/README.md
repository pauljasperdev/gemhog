# entity

Entity resolution and management for Gemhog. Provides repository, resolver, and
external client integrations (OpenFIGI, Wikidata).

## Quick Verification

Run all mandatory smoke commands to verify the package works locally:

```bash
# 1. Start the database
pnpm db:start

# 2. Seed test data (idempotent — safe to run twice)
pnpm --filter @gemhog/entity smoke:seed

# 3. Verify repository layer (idempotent)
pnpm --filter @gemhog/entity smoke:repository

# 4. Verify resolver — exact path (prints EXACT_PATH_CONFIRMED)
pnpm --filter @gemhog/entity smoke:resolver

# 5. Verify resolver — non-exact path (prints NON_EXACT_PATH_CONFIRMED)
pnpm --filter @gemhog/entity smoke:resolver:fallback

# 6. Verify OpenFIGI ticker lookup (live API)
pnpm --filter @gemhog/entity smoke:openfigi

# 7. Verify OpenFIGI name query (live API)
pnpm --filter @gemhog/entity smoke:openfigi:name "NVIDIA"
pnpm --filter @gemhog/entity smoke:openfigi:name "unknown-company-404"

# 8. Verify Wikidata API
pnpm --filter @gemhog/entity smoke:wikidata

# 9. Verify Live AI Resolver
pnpm --filter @gemhog/entity smoke:resolver:live "NVDA" company
pnpm --filter @gemhog/entity smoke:resolver:live "Tim Cook" person
```

This composes `EntityLayer` with the balanced Anthropic model for LLM fallback
resolution. Only run this if you have valid credentials configured.

---

## Smoke Commands

| Command                   | Purpose                                  | Mandatory | Notes                                     |
| ------------------------- | ---------------------------------------- | --------- | ----------------------------------------- |
| `smoke:seed`              | Verify rerunnable seed writes            | Yes       | Must pass twice in a row                  |
| `smoke:repository`        | Verify rerunnable create/read/alias flow | Yes       | Must pass twice in a row                  |
| `smoke:resolver`          | Verify deterministic exact path          | Yes       | Prints `EXACT_PATH_CONFIRMED`             |
| `smoke:resolver:fallback` | Verify deterministic non-exact path      | Yes       | Prints `NON_EXACT_PATH_CONFIRMED`         |
| `smoke:resolver:fuzzy`    | Verify deterministic fuzzy path          | Yes       | Prints `FUZZY_PATH_CONFIRMED`             |
| `smoke:openfigi`          | Verify ticker lookup (live API)          | Yes       | Fails with typed error on unknown ticker  |
| `smoke:openfigi:name`     | Verify name query (live API)             | Yes       | Returns array; empty array for no-results |
| `smoke:wikidata`          | Verify Wikidata API                      | Yes       | No DB needed                              |
| `smoke:resolver:live`     | Credentialed live sanity check           | No        | Optional; exact path is acceptable        |

---

## Resolver Strategy Field

The `strategy` field on `ResolvedEntity` describes which resolution path won.
Smoke scripts print it so you can assert the right path in logs or CI.

| Value         | Meaning                                         |
| ------------- | ----------------------------------------------- |
| `exact_match` | DB hit on ticker or alias — fastest path        |
| `fuzzy_match` | DB fuzzy name match — no LLM needed             |
| `llm_match`   | LLM identified an existing entity in the DB     |
| `llm_create`  | LLM created a new entity (no prior match found) |

`smoke:resolver` asserts `strategy === "exact_match"` for NVDA and prints
`EXACT_PATH_CONFIRMED`. `smoke:resolver:fallback` uses a mock LLM to force
`llm_match` and prints `NON_EXACT_PATH_CONFIRMED`. Together they prove both
branches of the resolver without requiring live AI credentials.

---

## OpenFIGI Semantics

The OpenFIGI client exposes two distinct lookup shapes. They behave differently
on zero results — understanding the difference matters for error handling.

### `lookupByTicker(ticker)`

Single-item lookup. If the ticker is not found, the effect **fails** with a
typed `OpenFigiNotFoundError`. It never returns null or an empty array.

```typescript
// Succeeds with instrument data
const result = yield * client.lookupByTicker("AAPL");

// Fails with OpenFigiNotFoundError — catch it explicitly
yield *
  client
    .lookupByTicker("UNKNOWN_TICKER_XYZ")
    .pipe(
      Effect.catchTag("OpenFigiNotFoundError", (e) =>
        Console.log(`Not found: ${e.ticker}`),
      ),
    );
```

`smoke:openfigi AAPL` (or `smoke:openfigi NVDA`) proves the success path.
Passing an unknown ticker exits with a non-zero code, proving the typed error.

### `lookupByName(name)`

Query-style search. Returns `ReadonlyArray<OpenFigiResult>`. An empty array
means no results — it is **not** an error. The effect never fails for zero
results.

```typescript
// Returns results array (may be empty)
const results = yield * client.lookupByName("NVIDIA");

// Empty array — not an error
const none = yield * client.lookupByName("unknown-company-404");
// none.length === 0, exit code 0
```

`smoke:openfigi:name "NVIDIA"` proves the non-empty path.
`smoke:openfigi:name "unknown-company-404"` proves the zero-results path exits
cleanly with code 0.

---

## Script Details

All scripts use `LOCAL_ENV=1` to load local dev defaults. No `.env` file needed.

### Scripts requiring a running database

Start the database first:

```bash
pnpm db:start
```

#### smoke:seed (seed-test-data)

Inserts a fixed set of test entities (Apple, Nvidia, Alphabet, Bitcoin, Tim
Cook, Federal Reserve, California) into the database. Skips any that already
exist. Run it twice to confirm idempotency.

```bash
pnpm --filter @gemhog/entity smoke:seed
```

#### smoke:repository (test-repository)

Creates a "Test Corp" entity, reads it back by ID, searches by name, adds a
ticker alias, and looks it up by alias. Skips creation if the entity already
exists. Run it twice to confirm idempotency.

```bash
pnpm --filter @gemhog/entity smoke:repository
```

#### smoke:resolver (test-resolver)

Resolves an entity by name and type through the full resolver stack. Defaults to
`NVDA / company`. Asserts `strategy === "exact_match"` for NVDA and prints
`EXACT_PATH_CONFIRMED` on success.

```bash
pnpm --filter @gemhog/entity smoke:resolver [name] [type]

# Examples
pnpm --filter @gemhog/entity smoke:resolver NVDA company
pnpm --filter @gemhog/entity smoke:resolver "Tim Cook" person
```

#### smoke:resolver:fallback (smoke-resolver-fallback)

Proves the non-exact resolution path without live LLM credentials. It:

1. Resolves NVDA via exact match to capture a real `entity_id` from the DB
2. Resolves a non-existent entity name using `MockModelLayer` (deterministic)
3. Asserts the result uses a non-exact strategy and prints
   `NON_EXACT_PATH_CONFIRMED`

This is mandatory. It proves the LLM fallback branch works without requiring
live AI credentials.

```bash
pnpm --filter @gemhog/entity smoke:resolver:fallback
```

### Live API scripts (no database needed)

These hit external APIs directly. No `pnpm db:start` required.

#### smoke:openfigi (test-openfigi)

Looks up a ticker via the OpenFIGI API and prints all matching instruments.
Results vary by exchange — NVDA returns several rows. Fails with a typed
`OpenFigiNotFoundError` if the ticker is not found.

```bash
pnpm --filter @gemhog/entity smoke:openfigi [ticker]

# Example
pnpm --filter @gemhog/entity smoke:openfigi NVDA
```

#### smoke:openfigi:name (test-openfigi-name)

Searches OpenFIGI by company name and prints the results array. Accepts any
string. Returns an empty array (exit 0) when no results match — this is not an
error.

```bash
pnpm --filter @gemhog/entity smoke:openfigi:name [query]

# Known company — returns results
pnpm --filter @gemhog/entity smoke:openfigi:name "NVIDIA"

# No results — returns empty array, exits 0
pnpm --filter @gemhog/entity smoke:openfigi:name "unknown-company-404"
```

#### smoke:wikidata (test-wikidata)

Searches Wikidata for a person, place, or institution. Wikidata rate-limits
aggressively — retries are built in (including 429), so occasional delays are
normal.

**Valid types**: `person`, `geography`, `institution`. The script validates the
type argument and exits with code 1 if an invalid type is provided.

```bash
pnpm --filter @gemhog/entity smoke:wikidata [query] [type]

# Examples
pnpm --filter @gemhog/entity smoke:wikidata "Tim Cook" person
pnpm --filter @gemhog/entity smoke:wikidata "Federal Reserve" institution

# Invalid type — exits 1 with error message listing valid types
pnpm --filter @gemhog/entity smoke:wikidata "Federal Reserve" company
```

### Optional: Live AI Resolver

#### smoke:resolver:live (smoke-resolver-live)

Resolves an entity using the full AI-powered resolver stack. This composes
`EntityLayer` with the balanced Anthropic model for LLM fallback when
exact/fuzzy matching fails.

**Requires**: An opencode OAuth session. This script reads a bearer token from
`~/.local/share/opencode/auth.json` at the key `anthropic.access`.
No API key environment variable is read by this path.
```bash
pnpm --filter @gemhog/entity smoke:resolver:live [name] [type]

# Examples
pnpm --filter @gemhog/entity smoke:resolver:live "NVDA" company
pnpm --filter @gemhog/entity smoke:resolver:live "Tim Cook" person
```

This is optional and not part of the mandatory verification path. An exact path
result (`strategy: exact_match`) is acceptable here.

Note: `NVDA company` can exit 0 via exact DB match without invoking the LLM.
Use a non-exact query to verify live bearer-backed resolution.
