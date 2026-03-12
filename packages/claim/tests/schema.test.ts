import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  ClaimEntity,
  ClaimSource,
  DisclosedPosition,
  EmbeddedClaim,
  EmbeddingMetadata,
  EpisodeStats,
  ExtractedClaim,
  RankedClaim,
  RankingMetadata,
  Speaker,
  Timeframe,
  ValidatedClaim,
  ValidationMetadata,
  ValidationReport,
  ValidationReportItem,
} from "../src/schema.js";

describe("ClaimSource schema", () => {
  it("decodes valid data", () => {
    const valid = {
      episode_id: "ep_test",
      podcast_id: "pod_test",
    };
    const result = Schema.decodeUnknownSync(ClaimSource)(valid);
    expect(result.episode_id).toBe("ep_test");
    expect(result.podcast_id).toBe("pod_test");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ClaimSource)({})).toThrow();
  });
});

describe("ClaimEntity schema", () => {
  it("decodes valid data", () => {
    const valid = {
      name: "NVIDIA",
      type: "company",
    };
    const result = Schema.decodeUnknownSync(ClaimEntity)(valid);
    expect(result.name).toBe("NVIDIA");
    expect(result.type).toBe("company");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ClaimEntity)({})).toThrow();
  });
});

describe("Speaker schema", () => {
  it("decodes valid data", () => {
    const valid = {
      name: "John Doe",
      role: "guest",
      company: "Acme Capital",
      speaker_label: "SPEAKER_01",
      confidence: "high",
    };
    const result = Schema.decodeUnknownSync(Speaker)(valid);
    expect(result.name).toBe("John Doe");
    expect(result.role).toBe("guest");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(Speaker)({})).toThrow();
  });
});

describe("Timeframe schema", () => {
  it("decodes valid data", () => {
    const valid = {
      horizon: "medium_term",
      expiration_date: null,
    };
    const result = Schema.decodeUnknownSync(Timeframe)(valid);
    expect(result.horizon).toBe("medium_term");
    expect(result.expiration_date).toBeNull();
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(Timeframe)({})).toThrow();
  });
});

describe("DisclosedPosition schema", () => {
  it("decodes valid data", () => {
    const valid = {
      type: "long",
      position_quote: "I own NVIDIA shares",
    };
    const result = Schema.decodeUnknownSync(DisclosedPosition)(valid);
    expect(result.type).toBe("long");
    expect(result.position_quote).toBe("I own NVIDIA shares");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(DisclosedPosition)({})).toThrow();
  });
});

describe("ExtractedClaim schema", () => {
  const validExtractedClaim = {
    id: "clm_ep_test_0",
    source: { episode_id: "ep_test", podcast_id: "pod_test" },
    claim: {
      type: "micro",
      stance: "bullish",
      statement: "NVIDIA will benefit from AI demand",
      reasoning: "Data center GPU demand is accelerating",
      entities: [{ name: "NVIDIA", type: "company" }],
      quotes: ["GPU demand is through the roof"],
    },
    extraction_confidence: 0.9,
    speaker: {
      name: "John Doe",
      role: "guest",
      company: "Acme Capital",
      speaker_label: "SPEAKER_01",
      confidence: "high",
    },
    timeframe: {
      horizon: "medium_term",
      expiration_date: null,
    },
    specificity_level: "high",
    evidentiary_basis: "expert_opinion",
    disclosed_position: {
      type: "long",
      position_quote: "I own NVIDIA shares",
    },
  };

  it("decodes valid data", () => {
    const result =
      Schema.decodeUnknownSync(ExtractedClaim)(validExtractedClaim);
    expect(result.id).toBe("clm_ep_test_0");
    expect(result.claim.statement).toBe("NVIDIA will benefit from AI demand");
    expect(result.extraction_confidence).toBe(0.9);
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ExtractedClaim)({})).toThrow();
  });
});

describe("ValidationMetadata schema", () => {
  it("decodes valid data", () => {
    const valid = {
      status: "PASS",
      validated_at: "2024-01-01T00:00:00Z",
    };
    const result = Schema.decodeUnknownSync(ValidationMetadata)(valid);
    expect(result.status).toBe("PASS");
    expect(result.validated_at).toBe("2024-01-01T00:00:00Z");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ValidationMetadata)({})).toThrow();
  });
});

describe("ValidatedClaim schema", () => {
  const validValidatedClaim = {
    id: "clm_ep_test_0",
    source: { episode_id: "ep_test", podcast_id: "pod_test" },
    claim: {
      type: "micro",
      stance: "bullish",
      statement: "NVIDIA will benefit from AI demand",
      reasoning: "Data center GPU demand is accelerating",
      entities: [{ name: "NVIDIA", type: "company" }],
      quotes: ["GPU demand is through the roof"],
    },
    extraction_confidence: 0.9,
    speaker: {
      name: "John Doe",
      role: "guest",
      company: "Acme Capital",
      speaker_label: "SPEAKER_01",
      confidence: "high",
    },
    timeframe: {
      horizon: "medium_term",
      expiration_date: null,
    },
    specificity_level: "high",
    evidentiary_basis: "expert_opinion",
    disclosed_position: {
      type: "long",
      position_quote: "I own NVIDIA shares",
    },
    validation: {
      status: "PASS",
      validated_at: "2024-01-01T00:00:00Z",
    },
  };

  it("decodes valid data", () => {
    const result =
      Schema.decodeUnknownSync(ValidatedClaim)(validValidatedClaim);
    expect(result.id).toBe("clm_ep_test_0");
    expect(result.validation.status).toBe("PASS");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ValidatedClaim)({})).toThrow();
  });
});

describe("RankingMetadata schema", () => {
  it("decodes valid data", () => {
    const valid = {
      score: 0.85,
      tags: ["notable_speaker", "high_specificity"],
    };
    const result = Schema.decodeUnknownSync(RankingMetadata)(valid);
    expect(result.score).toBe(0.85);
    expect(result.tags).toContain("notable_speaker");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(RankingMetadata)({})).toThrow();
  });
});

describe("RankedClaim schema", () => {
  const validRankedClaim = {
    id: "clm_ep_test_0",
    source: { episode_id: "ep_test", podcast_id: "pod_test" },
    claim: {
      type: "micro",
      stance: "bullish",
      statement: "NVIDIA will benefit from AI demand",
      reasoning: "Data center GPU demand is accelerating",
      entities: [{ name: "NVIDIA", type: "company" }],
      quotes: ["GPU demand is through the roof"],
    },
    extraction_confidence: 0.9,
    speaker: {
      name: "John Doe",
      role: "guest",
      company: "Acme Capital",
      speaker_label: "SPEAKER_01",
      confidence: "high",
    },
    timeframe: {
      horizon: "medium_term",
      expiration_date: null,
    },
    specificity_level: "high",
    evidentiary_basis: "expert_opinion",
    disclosed_position: {
      type: "long",
      position_quote: "I own NVIDIA shares",
    },
    validation: {
      status: "PASS",
      validated_at: "2024-01-01T00:00:00Z",
    },
    ranking: {
      score: 0.85,
      tags: ["notable_speaker", "high_specificity"],
    },
  };

  it("decodes valid data", () => {
    const result = Schema.decodeUnknownSync(RankedClaim)(validRankedClaim);
    expect(result.id).toBe("clm_ep_test_0");
    expect(result.ranking.score).toBe(0.85);
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(RankedClaim)({})).toThrow();
  });
});

describe("EmbeddingMetadata schema", () => {
  it("decodes valid data", () => {
    const valid = {
      vector: [0.1, 0.2, 0.3],
      model: "text-embedding-3-small",
      input_text: "NVIDIA will benefit...",
    };
    const result = Schema.decodeUnknownSync(EmbeddingMetadata)(valid);
    expect(result.vector).toEqual([0.1, 0.2, 0.3]);
    expect(result.model).toBe("text-embedding-3-small");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(EmbeddingMetadata)({})).toThrow();
  });
});

describe("EmbeddedClaim schema", () => {
  const validEmbeddedClaim = {
    id: "clm_ep_test_0",
    source: { episode_id: "ep_test", podcast_id: "pod_test" },
    claim: {
      type: "micro",
      stance: "bullish",
      statement: "NVIDIA will benefit from AI demand",
      reasoning: "Data center GPU demand is accelerating",
      entities: [{ name: "NVIDIA", type: "company" }],
      quotes: ["GPU demand is through the roof"],
    },
    extraction_confidence: 0.9,
    speaker: {
      name: "John Doe",
      role: "guest",
      company: "Acme Capital",
      speaker_label: "SPEAKER_01",
      confidence: "high",
    },
    timeframe: {
      horizon: "medium_term",
      expiration_date: null,
    },
    specificity_level: "high",
    evidentiary_basis: "expert_opinion",
    disclosed_position: {
      type: "long",
      position_quote: "I own NVIDIA shares",
    },
    validation: {
      status: "PASS",
      validated_at: "2024-01-01T00:00:00Z",
    },
    ranking: {
      score: 0.85,
      tags: ["notable_speaker", "high_specificity"],
    },
    embedding: {
      vector: [0.1, 0.2, 0.3],
      model: "text-embedding-3-small",
      input_text: "NVIDIA will benefit from AI demand",
    },
    full_text:
      "NVIDIA will benefit from AI demand. Data center GPU demand is accelerating.",
    entity_names: ["NVIDIA"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("decodes valid data", () => {
    const result = Schema.decodeUnknownSync(EmbeddedClaim)(validEmbeddedClaim);
    expect(result.id).toBe("clm_ep_test_0");
    expect(result.embedding.model).toBe("text-embedding-3-small");
    expect(result.full_text).toContain("NVIDIA");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(EmbeddedClaim)({})).toThrow();
  });
});

describe("EpisodeStats schema", () => {
  const validEpisodeStats = {
    episode_id: "ep_test",
    podcast_id: "pod_test",
    podcast_name: "Test Podcast",
    podcast_reach_score: 75,
    claim_count: 5,
    avg_confidence: 0.85,
    hosts: [{ name: "Jane Smith", company: null }],
    guests: [{ name: "John Doe", company: "Acme Capital", occupation: null }],
  };

  it("decodes valid data", () => {
    const result = Schema.decodeUnknownSync(EpisodeStats)(validEpisodeStats);
    expect(result.episode_id).toBe("ep_test");
    expect(result.podcast_name).toBe("Test Podcast");
    expect(result.hosts[0]?.name).toBe("Jane Smith");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(EpisodeStats)({})).toThrow();
  });
});

describe("ValidationReportItem schema", () => {
  it("decodes valid data", () => {
    const valid = {
      claim_index: 0,
      status: "PASS",
      reason: null,
    };
    const result = Schema.decodeUnknownSync(ValidationReportItem)(valid);
    expect(result.claim_index).toBe(0);
    expect(result.status).toBe("PASS");
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ValidationReportItem)({})).toThrow();
  });
});

describe("ValidationReport schema", () => {
  const validValidationReport = {
    claims: [{ claim_index: 0, status: "PASS", reason: null }],
    summary: { passed: 1, failed: 0, rejected: 0 },
  };

  it("decodes valid data", () => {
    const result = Schema.decodeUnknownSync(ValidationReport)(
      validValidationReport,
    );
    expect(result.claims[0]?.status).toBe("PASS");
    expect(result.summary.passed).toBe(1);
  });

  it("throws on invalid data (missing fields)", () => {
    expect(() => Schema.decodeUnknownSync(ValidationReport)({})).toThrow();
  });
});
