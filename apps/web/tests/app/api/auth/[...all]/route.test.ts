// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const { handler } = vi.hoisted(() => {
  return {
    handler: vi.fn(),
  };
});

vi.mock("@gemhog/auth", () => ({
  auth: {
    handler,
  },
}));

import { GET, POST } from "../../../../../src/app/api/auth/[...all]/route";

describe("/api/auth handler", () => {
  it("exports GET and POST handlers", () => {
    expect(GET).toBeTypeOf("function");
    expect(POST).toBeTypeOf("function");
  });
});
