import "@gemhog/env/server";
import { SqlLive } from "@gemhog/db";
import { Effect, Layer } from "effect";
import { EntityRepository } from "../src/repository";
import { EntityRepositoryLive } from "../src/repository.live";

const program = Effect.gen(function* () {
  const repo = yield* EntityRepository;

  // Find-or-create "Test Corp" (idempotent)
  const existingByAlias = yield* repo.findEntityByAlias("TEST");
  const entity = existingByAlias
    ? existingByAlias
    : yield* repo.createEntity({
        canonical_name: "Test Corp",
        type: "company",
        ticker: "TEST",
        description: "Test entity for script verification",
      });

  console.log(
    existingByAlias ? "Found existing:" : "Created:",
    JSON.stringify(entity, null, 2),
  );

  const readEntity = yield* repo.readEntityById(entity.id);
  console.log("Read by ID:", JSON.stringify(readEntity, null, 2));

  const searchResults = yield* repo.searchEntitiesByName("Test Corp");
  console.log("Search results:", JSON.stringify(searchResults, null, 2));

  // Idempotent alias creation: check if alias already exists
  const existingAlias = yield* repo.findEntityByAlias("TEST");
  if (!existingAlias) {
    const alias = yield* repo.createAlias({
      entity_id: entity.id,
      alias: "TEST",
      alias_type: "ticker",
      source: "test-script",
    });
    console.log("Created alias:", JSON.stringify(alias, null, 2));
  } else {
    console.log("Alias already exists, skipping creation");
  }

  const foundByAlias = yield* repo.findEntityByAlias("TEST");
  console.log("Found by alias:", JSON.stringify(foundByAlias, null, 2));
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
