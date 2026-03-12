import type { ModelSpec } from "./model";

/**
 * Heavy preset: Claude Opus with extended thinking enabled.
 * 10k token thinking budget, 16384 max_tokens to accommodate budget.
 */
export const heavyAnthropicSpec: ModelSpec = {
  name: "claude-opus-4-5",
  anthropic: {
    thinking: { type: "enabled", budget_tokens: 10000 },
    max_tokens: 16384,
  },
};

/**
 * Balanced preset: Claude Sonnet with extended thinking enabled at max budget.
 */
export const balancedAnthropicSpec: ModelSpec = {
  name: "claude-sonnet-4-6",
  anthropic: {
    thinking: { type: "enabled", budget_tokens: 16000 },
    max_tokens: 32768,
  },
};

/**
 * Light preset: Claude Haiku without extended thinking.
 */
export const lightAnthropicSpec: ModelSpec = {
  name: "claude-haiku-4-5",
  anthropic: {
    thinking: { type: "disabled" },
  },
};
