import * as Effect from "effect";
import type { OpenFigiError, OpenFigiNotFoundError } from "./errors";

export interface OpenFigiResult {
  readonly figi: string;
  readonly name: string;
  readonly ticker: string;
  readonly exchCode: string | null;
  readonly securityType: string;
}

interface OpenFigiClientShape {
  readonly lookupByTicker: (
    ticker: string,
  ) => Effect.Effect.Effect<
    OpenFigiResult,
    OpenFigiNotFoundError | OpenFigiError,
    never
  >;

  readonly lookupByName: (
    name: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<OpenFigiResult>,
    OpenFigiError,
    never
  >;
}

export class OpenFigiClient extends Effect.Context.Tag(
  "@gemhog/entity/OpenFigiClient",
)<OpenFigiClient, OpenFigiClientShape>() {}
