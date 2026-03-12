import * as Effect from "effect";

export class ClaimNotFoundError extends Effect.Data.TaggedError(
  "ClaimNotFoundError",
)<{
  identifier: string;
}> {}

export class ClaimRepositoryError extends Effect.Data.TaggedError(
  "ClaimRepositoryError",
)<{
  readonly cause: unknown;
}> {}

export class DuplicateClaimError extends Effect.Data.TaggedError(
  "DuplicateClaimError",
)<{
  claimId: string;
  originalClaimId: string;
}> {}
