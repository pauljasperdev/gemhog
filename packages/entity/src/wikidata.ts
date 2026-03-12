import * as Effect from "effect";
import type { WikidataError } from "./errors";

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

interface WikidataClientShape {
  readonly searchPerson: (
    query: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<WikidataResult>,
    WikidataError,
    never
  >;

  readonly searchPlace: (
    query: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<WikidataResult>,
    WikidataError,
    never
  >;

  readonly searchInstitution: (
    query: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<WikidataResult>,
    WikidataError,
    never
  >;

  readonly getEntity: (
    qid: string,
  ) => Effect.Effect.Effect<WikidataEntity, WikidataError, never>;
}

export class WikidataClient extends Effect.Context.Tag(
  "@gemhog/entity/WikidataClient",
)<WikidataClient, WikidataClientShape>() {}
