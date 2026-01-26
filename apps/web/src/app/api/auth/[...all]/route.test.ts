// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const { handler } = vi.hoisted(() => {
  return {
    handler: vi.fn(),
  };
});

vi.mock("@gemhog/core/auth", () => ({
  auth: {
    handler,
  },
}));

import { GET, POST } from "./route";

describe("/api/auth handler", () => {
  it("exports GET and POST handlers", () => {
    expect(GET).toBeTypeOf("function");
    expect(POST).toBeTypeOf("function");
  });
});
