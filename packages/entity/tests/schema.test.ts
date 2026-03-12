import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  EntityAliasSchema,
  EntityMetadata,
  EntitySchema,
  ResolvedEntitySchema,
} from "../src/schema.js";

describe("EntityMetadata schema", () => {
  it("decodes valid data", () => {
    const valid = { sector: "Technology", industry: "Semiconductors" };
    const result = Schema.decodeUnknownSync(EntityMetadata)(valid);
    expect(result).toEqual(valid);
  });

  it("decodes empty object", () => {
    const result = Schema.decodeUnknownSync(EntityMetadata)({});
    expect(result).toEqual({});
  });
});

describe("EntitySchema schema", () => {
  const validEntity = {
    id: "ent_test_123",
    canonical_name: "NVIDIA Corporation",
    type: "company",
    figi: "BBG000BBJQV0",
    wikidata_qid: null,
    ticker: "NVDA",
    exchange: "XNAS",
    description: "Semiconductor company",
    metadata: { sector: "Technology", industry: "Semiconductors" },
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("decodes valid data", () => {
    const result = Schema.decodeUnknownSync(EntitySchema)(validEntity);
    expect(result.id).toBe("ent_test_123");
    expect(result.canonical_name).toBe("NVIDIA Corporation");
    expect(result.type).toBe("company");
    expect(result.ticker).toBe("NVDA");
    expect(result.status).toBe("active");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(EntitySchema)({})).toThrow();
  });

  it("throws on invalid type literal", () => {
    const invalid = {
      ...validEntity,
      type: "invalid_type",
    };
    expect(() => Schema.decodeUnknownSync(EntitySchema)(invalid)).toThrow();
  });

  it("throws on invalid status literal", () => {
    const invalid = {
      ...validEntity,
      status: "unknown",
    };
    expect(() => Schema.decodeUnknownSync(EntitySchema)(invalid)).toThrow();
  });
});

describe("EntityAliasSchema schema", () => {
  const validEntityAlias = {
    id: "alias_test_123",
    entity_id: "ent_test_123",
    alias: "NVDA",
    alias_type: "ticker",
    source: "openfigi",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("decodes valid data", () => {
    const result =
      Schema.decodeUnknownSync(EntityAliasSchema)(validEntityAlias);
    expect(result.id).toBe("alias_test_123");
    expect(result.entity_id).toBe("ent_test_123");
    expect(result.alias).toBe("NVDA");
    expect(result.alias_type).toBe("ticker");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(EntityAliasSchema)({})).toThrow();
  });

  it("throws on invalid alias_type literal", () => {
    const invalid = {
      ...validEntityAlias,
      alias_type: "invalid",
    };
    expect(() =>
      Schema.decodeUnknownSync(EntityAliasSchema)(invalid),
    ).toThrow();
  });
});

describe("ResolvedEntitySchema schema", () => {
  const validEntity = {
    id: "ent_test_123",
    canonical_name: "NVIDIA Corporation",
    type: "company",
    figi: "BBG000BBJQV0",
    wikidata_qid: null,
    ticker: "NVDA",
    exchange: "XNAS",
    description: "Semiconductor company",
    metadata: { sector: "Technology", industry: "Semiconductors" },
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  const validResolvedEntity = {
    entity: validEntity,
    match_confidence: 0.99,
    match_source: "exact_alias",
  };

  it("decodes valid data", () => {
    const result =
      Schema.decodeUnknownSync(ResolvedEntitySchema)(validResolvedEntity);
    expect(result.entity.id).toBe("ent_test_123");
    expect(result.match_confidence).toBe(0.99);
    expect(result.match_source).toBe("exact_alias");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ResolvedEntitySchema)({})).toThrow();
  });

  it("throws on invalid entity data", () => {
    const invalid = {
      entity: {},
      match_confidence: 0.99,
      match_source: "exact_alias",
    };
    expect(() =>
      Schema.decodeUnknownSync(ResolvedEntitySchema)(invalid),
    ).toThrow();
  });
});
