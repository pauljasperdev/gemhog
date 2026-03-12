import { Tool, Toolkit } from "@effect/ai";
import * as Effect from "effect";

const LookupOpenFigi = Tool.make("lookup_openfigi", {
  description:
    "Look up a company or asset by ticker symbol using OpenFIGI API to get canonical FIGI identifier",
  parameters: {
    ticker: Effect.Schema.String,
  },
  success: Effect.Schema.Union(
    Effect.Schema.Struct({
      found: Effect.Schema.Literal(true),
      figi: Effect.Schema.String,
      name: Effect.Schema.String,
      ticker: Effect.Schema.String,
      exchCode: Effect.Schema.NullOr(Effect.Schema.String),
      securityType: Effect.Schema.String,
    }),
    Effect.Schema.Struct({
      found: Effect.Schema.Literal(false),
      ticker: Effect.Schema.String,
    }),
  ),
  failureMode: "error",
  failure: Effect.Schema.Struct({
    error: Effect.Schema.Literal("OpenFigiError"),
    message: Effect.Schema.String,
  }),
});

const WikidataFailure = Effect.Schema.Struct({
  error: Effect.Schema.Literal("WikidataError"),
  message: Effect.Schema.String,
});

const LookupWikidata = Tool.make("lookup_wikidata", {
  description:
    "Look up a person, place, or institution in Wikidata to get QID and canonical information",
  parameters: {
    query: Effect.Schema.String,
    type: Effect.Schema.Literal("person", "geography", "institution"),
  },
  success: Effect.Schema.Array(
    Effect.Schema.Struct({
      qid: Effect.Schema.String,
      label: Effect.Schema.String,
      description: Effect.Schema.String,
    }),
  ),
  failureMode: "error",
  failure: WikidataFailure,
});

const ToolFailure = Effect.Schema.Struct({
  error: Effect.Schema.Literal("EntityRepositoryError", "EntityNotFoundError"),
  message: Effect.Schema.String,
});

const SearchEntities = Tool.make("search_entities", {
  description:
    "Search for existing entities in our database by name similarity",
  parameters: {
    query: Effect.Schema.String,
    type: Effect.Schema.optional(Effect.Schema.String),
  },
  success: Effect.Schema.Array(
    Effect.Schema.Struct({
      id: Effect.Schema.String,
      canonical_name: Effect.Schema.String,
      score: Effect.Schema.Number,
    }),
  ),
  failureMode: "error",
  failure: ToolFailure,
});

const CreateEntity = Tool.make("create_entity", {
  description: "Create a new canonical entity record in the database",
  parameters: {
    canonical_name: Effect.Schema.String,
    type: Effect.Schema.String,
    figi: Effect.Schema.optional(Effect.Schema.String),
    ticker: Effect.Schema.optional(Effect.Schema.String),
    wikidata_qid: Effect.Schema.optional(Effect.Schema.String),
    description: Effect.Schema.optional(Effect.Schema.String),
  },
  success: Effect.Schema.Struct({ entity_id: Effect.Schema.String }),
  failureMode: "error",
  failure: ToolFailure,
});

const AddAlias = Tool.make("add_alias", {
  description: "Register a variant name that maps to an existing entity",
  parameters: {
    entity_id: Effect.Schema.String,
    alias: Effect.Schema.String,
    alias_type: Effect.Schema.Literal(
      "ticker",
      "abbrev",
      "legal",
      "colloquial",
    ),
    source: Effect.Schema.String,
  },
  success: Effect.Schema.Struct({ success: Effect.Schema.Boolean }),
  failureMode: "error",
  failure: ToolFailure,
});

const EntityToolkit = Toolkit.make(
  LookupOpenFigi,
  LookupWikidata,
  SearchEntities,
  CreateEntity,
  AddAlias,
);

export {
  LookupOpenFigi,
  LookupWikidata,
  SearchEntities,
  CreateEntity,
  AddAlias,
  EntityToolkit,
};
