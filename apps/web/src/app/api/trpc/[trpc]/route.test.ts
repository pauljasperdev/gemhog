// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("@gemhog/api/context", () => ({
  createContext: vi.fn(),
}));

vi.mock("@gemhog/api/routers/index", () => ({
  appRouter: {},
}));

vi.mock("@gemhog/env/server", () => ({
  env: {
    NODE_ENV: "test",
  },
}));

import { GET, POST } from "./route";

describe("/api/trpc handler", () => {
  it("exports GET and POST handlers", () => {
    expect(GET).toBeTypeOf("function");
    expect(POST).toBeTypeOf("function");
  });
});
