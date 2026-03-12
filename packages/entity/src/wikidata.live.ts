import {
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect";
import { Schema } from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import { WikidataError } from "./errors";
import { WikidataClient } from "./wikidata";

const WikidataSearchItem = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  description: Schema.optional(Schema.String),
});

const WikidataSearchResponse = Schema.Struct({
  search: Schema.Array(WikidataSearchItem),
});

const WikidataEntityLabel = Schema.Struct({
  value: Schema.String,
});

const WikidataEntityData = Schema.Struct({
  id: Schema.String,
  labels: Schema.optional(
    Schema.Struct({
      en: Schema.optional(WikidataEntityLabel),
    }),
  ),
  descriptions: Schema.optional(
    Schema.Struct({
      en: Schema.optional(WikidataEntityLabel),
    }),
  ),
  aliases: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
  claims: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.Unknown }),
  ),
});

const WikidataEntitiesResponse = Schema.Struct({
  entities: Schema.Record({ key: Schema.String, value: WikidataEntityData }),
});

interface WikidataResult {
  readonly qid: string;
  readonly label: string;
  readonly description: string;
}

interface WikidataEntity {
  readonly qid: string;
  readonly label: string;
  readonly description: string;
  readonly aliases: ReadonlyArray<string>;
  readonly claims: Record<string, unknown>;
}

// Transient HTTP errors that should trigger automatic retry
// Includes 429 (rate limit) as Wikidata applies aggressive rate limiting
const TRANSIENT_STATUSES = [408, 429, 500, 502, 503, 504];

// Maximum results to return from Wikidata search
const WIKIDATA_SEARCH_LIMIT = 5;

const isTransient = (e: unknown): boolean => {
  if (e instanceof HttpClientError.ResponseError) {
    return TRANSIENT_STATUSES.includes(e.response.status);
  }
  if (e instanceof HttpClientError.RequestError) {
    return e.reason === "Transport";
  }
  return false;
};

export const WikidataClientLive = Effect.Layer.scoped(
  WikidataClient,
  Effect.Effect.gen(function* () {
    const baseUrl = "https://www.wikidata.org/w/api.php";
    const client = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    const searchEntities = Effect.Effect.fn("entity.wikidata.searchEntities")(
      function* (query: string) {
        yield* annotateCurrentSpan("query", query);
        const request = HttpClientRequest.get(baseUrl).pipe(
          HttpClientRequest.appendUrlParam("action", "wbsearchentities"),
          HttpClientRequest.appendUrlParam("search", query),
          HttpClientRequest.appendUrlParam("language", "en"),
          HttpClientRequest.appendUrlParam("format", "json"),
          HttpClientRequest.appendUrlParam("type", "item"),
          // Wikidata search result limit - small to reduce API load
          HttpClientRequest.appendUrlParam(
            "limit",
            String(WIKIDATA_SEARCH_LIMIT),
          ),
        );
        const response = yield* client.execute(request);
        const body = yield* HttpClientResponse.schemaBodyJson(
          WikidataSearchResponse,
        )(response);

        const results: WikidataResult[] = [];
        for (const item of body.search) {
          results.push({
            qid: item.id,
            label: item.label,
            description: item.description ?? "",
          });
        }
        return results as ReadonlyArray<WikidataResult>;
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.retry({
            while: isTransient,
            times: 3,
            schedule: Effect.Schedule.exponential("500 millis"),
          }),
          Effect.Effect.mapError(
            (cause: unknown) => new WikidataError({ cause }),
          ),
        ),
    );

    const searchPerson = Effect.Effect.fn("entity.wikidata.searchPerson")(
      function* (query: string) {
        yield* annotateCurrentSpan("query", query);
        return yield* searchEntities(query);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.mapError(
            (cause: unknown) => new WikidataError({ cause }),
          ),
        ),
    );

    const searchPlace = Effect.Effect.fn("entity.wikidata.searchPlace")(
      function* (query: string) {
        yield* annotateCurrentSpan("query", query);
        return yield* searchEntities(query);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.mapError(
            (cause: unknown) => new WikidataError({ cause }),
          ),
        ),
    );

    const searchInstitution = Effect.Effect.fn(
      "entity.wikidata.searchInstitution",
    )(
      function* (query: string) {
        yield* annotateCurrentSpan("query", query);
        return yield* searchEntities(query);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.mapError(
            (cause: unknown) => new WikidataError({ cause }),
          ),
        ),
    );

    const getEntity = Effect.Effect.fn("entity.wikidata.getEntity")(
      function* (qid: string) {
        yield* annotateCurrentSpan("qid", qid);
        const request = HttpClientRequest.get(baseUrl).pipe(
          HttpClientRequest.appendUrlParam("action", "wbgetentities"),
          HttpClientRequest.appendUrlParam("ids", qid),
          HttpClientRequest.appendUrlParam("format", "json"),
          HttpClientRequest.appendUrlParam("languages", "en"),
        );
        const response = yield* client.execute(request);
        const body = yield* HttpClientResponse.schemaBodyJson(
          WikidataEntitiesResponse,
        )(response);

        const entityData = body.entities[qid];
        if (!entityData) {
          return yield* Effect.Effect.fail(
            new WikidataError({ cause: `Entity not found: ${qid}` }),
          );
        }

        const aliasArray: string[] = [];
        if (entityData.aliases?.en) {
          const enAliases = entityData.aliases.en as Array<{ value: string }>;
          if (Array.isArray(enAliases)) {
            for (const alias of enAliases) {
              if (alias && typeof alias.value === "string") {
                aliasArray.push(alias.value);
              }
            }
          }
        }

        const result: WikidataEntity = {
          qid: entityData.id,
          label: entityData.labels?.en?.value ?? "",
          description: entityData.descriptions?.en?.value ?? "",
          aliases: aliasArray,
          claims: entityData.claims ?? {},
        };
        return result;
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.retry({
            while: isTransient,
            times: 3,
            schedule: Effect.Schedule.exponential("500 millis"),
          }),
          Effect.Effect.mapError(
            (cause: unknown) => new WikidataError({ cause }),
          ),
        ),
    );

    return WikidataClient.of({
      searchPerson,
      searchPlace,
      searchInstitution,
      getEntity,
    });
  }).pipe(
    Effect.Effect.mapError((cause: unknown) => new WikidataError({ cause })),
  ),
);
