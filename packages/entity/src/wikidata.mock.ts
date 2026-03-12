import * as Effect from "effect";
import { WikidataError } from "./errors";
import { WikidataClient } from "./wikidata";

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

const SEARCH_FIXTURES: Record<string, WikidataResult[]> = {
  "warren buffett": [
    {
      qid: "Q47213",
      label: "Warren Buffett",
      description: "American business magnate and investor",
    },
  ],
  buffett: [
    {
      qid: "Q47213",
      label: "Warren Buffett",
      description: "American business magnate and investor",
    },
  ],
  "federal reserve": [
    {
      qid: "Q47488",
      label: "Federal Reserve System",
      description: "central banking system of the United States",
    },
  ],
  fed: [
    {
      qid: "Q47488",
      label: "Federal Reserve System",
      description: "central banking system of the United States",
    },
  ],
};

const ENTITY_FIXTURES: Record<string, WikidataEntity> = {
  Q47213: {
    qid: "Q47213",
    label: "Warren Buffett",
    description: "American business magnate and investor",
    aliases: ["Buffett", "Oracle of Omaha"],
    claims: { P31: "human", P27: "United States of America" },
  },
  Q47488: {
    qid: "Q47488",
    label: "Federal Reserve System",
    description: "central banking system of the United States",
    aliases: ["Fed", "Federal Reserve", "The Fed"],
    claims: { P31: "central bank", P17: "United States of America" },
  },
};

export const MockWikidataClient = Effect.Layer.succeed(
  WikidataClient,
  WikidataClient.of({
    searchPerson: (query) => {
      const results = SEARCH_FIXTURES[query.toLowerCase()] ?? [];
      return Effect.Effect.succeed(results);
    },
    searchPlace: (query) => {
      const results = SEARCH_FIXTURES[query.toLowerCase()] ?? [];
      return Effect.Effect.succeed(results);
    },
    searchInstitution: (query) => {
      const results = SEARCH_FIXTURES[query.toLowerCase()] ?? [];
      return Effect.Effect.succeed(results);
    },
    getEntity: (qid) => {
      const entity = ENTITY_FIXTURES[qid];
      if (!entity) {
        return Effect.Effect.fail(
          new WikidataError({ cause: `Entity not found: ${qid}` }),
        );
      }
      return Effect.Effect.succeed(entity);
    },
  }),
);
