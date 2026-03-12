import "@gemhog/env/server";
import { SqlLive } from "@gemhog/db";
import { Effect, Layer } from "effect";
import { EntityRepository } from "../src/repository";
import { EntityRepositoryLive } from "../src/repository.live";

const program = Effect.gen(function* () {
  const repo = yield* EntityRepository;

  const seedData = [
    {
      canonical_name: "Apple Inc",
      type: "company" as const,
      ticker: "AAPL",
      alias: "AAPL",
    },
    {
      canonical_name: "Nvidia Corporation",
      type: "company" as const,
      ticker: "NVDA",
      alias: "NVDA",
    },
    {
      canonical_name: "Alphabet Inc",
      type: "company" as const,
      ticker: "GOOGL",
      alias: "GOOGL",
    },
    {
      canonical_name: "Bitcoin",
      type: "asset" as const,
      ticker: "BTC",
      alias: "BTC",
    },
    {
      canonical_name: "Tim Cook",
      type: "person" as const,
      ticker: null,
      alias: null,
    },
    {
      canonical_name: "Federal Reserve",
      type: "institution" as const,
      ticker: null,
      alias: null,
    },
    {
      canonical_name: "California",
      type: "geography" as const,
      ticker: null,
      alias: null,
    },
  ];

  for (const item of seedData) {
    // For items with an alias, check alias table; for those without, search by name+type
    const existing = item.alias
      ? yield* repo.findEntityByAlias(item.alias)
      : yield* repo
          .searchEntitiesByName(item.canonical_name, item.type)
          .pipe(Effect.map((results) => results[0] ?? null));

    if (existing) {
      console.log(`Skipped: ${item.canonical_name} (already exists)`);
    } else {
      const entity = yield* repo.createEntity({
        canonical_name: item.canonical_name,
        type: item.type,
        ticker: item.ticker,
      });

      if (item.alias) {
        yield* repo.createAlias({
          entity_id: entity.id,
          alias: item.alias,
          alias_type: "ticker",
          source: "seed-script",
        });
      }

      console.log(`Created: ${item.canonical_name}`);
    }
  }
});

Effect.runPromise(
  program.pipe(
    Effect.provide(EntityRepositoryLive.pipe(Layer.provide(SqlLive))),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
