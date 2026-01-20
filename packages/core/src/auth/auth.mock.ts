import { Effect, Layer } from "effect";
import { AuthService } from "./auth.service";

// Mock session data for testing
const mockSession = {
  user: { id: "test-user-id", email: "test@example.com", name: "Test User" },
  session: { id: "test-session-id", userId: "test-user-id" },
};

// Mock AuthService for unit tests
export const AuthServiceTest = Layer.succeed(AuthService, {
  getSession: () => Effect.succeed(mockSession as never),
  handler: async () => new Response("OK", { status: 200 }),
});

// Mock for unauthenticated scenarios
export const AuthServiceTestUnauthenticated = Layer.succeed(AuthService, {
  getSession: () => Effect.succeed(null as never),
  handler: async () => new Response("OK", { status: 200 }),
});
