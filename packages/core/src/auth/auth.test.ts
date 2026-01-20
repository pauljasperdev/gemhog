// packages/core/src/auth/auth.test.ts
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { AuthServiceTest, AuthServiceTestUnauthenticated } from "./auth.mock";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("getSession returns mock session when authenticated", async () => {
    const program = Effect.gen(function* () {
      const authService = yield* AuthService;
      const session = yield* authService.getSession(new Headers());
      return session;
    }).pipe(Effect.provide(AuthServiceTest));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
    expect(result?.user?.id).toBe("test-user-id");
  });

  it("getSession returns null when unauthenticated", async () => {
    const program = Effect.gen(function* () {
      const authService = yield* AuthService;
      const session = yield* authService.getSession(new Headers());
      return session;
    }).pipe(Effect.provide(AuthServiceTestUnauthenticated));

    const result = await Effect.runPromise(program);
    expect(result).toBeNull();
  });
});
