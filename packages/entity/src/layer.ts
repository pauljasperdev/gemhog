import { FetchHttpClient } from "@effect/platform";
import { SqlLive } from "@gemhog/db";
import * as Effect from "effect";
import { OpenFigiClientLive } from "./openfigi.live";
import { MockOpenFigiClient } from "./openfigi.mock";
import { EntityRepositoryLive } from "./repository.live";
import { EntityResolverServiceLive } from "./resolver.live";
import { WikidataClientLive } from "./wikidata.live";
import { MockWikidataClient } from "./wikidata.mock";

const EntityRepositoryLayer = EntityRepositoryLive.pipe(
  Effect.Layer.provide(SqlLive),
);

export const OpenFigiLayer = Effect.Layer.unwrapEffect(
  Effect.Effect.gen(function* () {
    const stage = yield* Effect.Config.string("SST_STAGE");
    return stage === "dev" || stage === "prod"
      ? OpenFigiClientLive
      : MockOpenFigiClient;
  }),
).pipe(Effect.Layer.provide(FetchHttpClient.layer));

export const WikidataLayer = Effect.Layer.unwrapEffect(
  Effect.Effect.gen(function* () {
    const stage = yield* Effect.Config.string("SST_STAGE");
    return stage === "dev" || stage === "prod"
      ? WikidataClientLive
      : MockWikidataClient;
  }),
).pipe(Effect.Layer.provide(FetchHttpClient.layer));

const EntityResolverLayer = EntityResolverServiceLive.pipe(
  Effect.Layer.provide(
    Effect.Layer.mergeAll(EntityRepositoryLayer, OpenFigiLayer, WikidataLayer),
  ),
);

export const EntityLayer = Effect.Layer.mergeAll(
  EntityRepositoryLayer,
  OpenFigiLayer,
  WikidataLayer,
  EntityResolverLayer,
);
