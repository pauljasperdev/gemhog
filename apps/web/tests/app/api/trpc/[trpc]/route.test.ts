// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@gemhog/api/context", () => ({
  createContext: vi.fn(),
}));

vi.mock("@gemhog/api/routers/index", () => ({
  appRouter: {},
}));

import { GET, POST } from "../../../../../src/app/api/trpc/[trpc]/route";

describe("/api/trpc handler", () => {
  it("exports GET and POST handlers", () => {
    expect(GET).toBeTypeOf("function");
    expect(POST).toBeTypeOf("function");
  });
});
