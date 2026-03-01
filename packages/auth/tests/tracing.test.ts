import { Effect, Tracer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { sendOtpEmail } from "../src/send-otp";

const TEST_ENV = {
  LOCAL_ENV: "1", // Use console email service for testing
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DATABASE_URL_POOLER: "postgresql://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "test-google-api-key",
  SENTRY_DSN: "https://key@sentry.io/123",
  RESEND_API_KEY: "test-resend-api-key",
};

/**
 * Helper type to capture span information during tests.
 */
interface SpanCapture {
  name: string;
  attributes: Map<string, unknown>;
}

/**
 * Creates a test tracer that wraps the default tracer and captures span info.
 * This allows us to verify span names and attributes without external dependencies.
 */
function createTestTracer(
  defaultTracer: Tracer.Tracer,
  capturedSpans: SpanCapture[],
): Tracer.Tracer {
  return Tracer.make({
    span(name, parent, context, links, startTime, kind, options) {
      const span = defaultTracer.span(
        name,
        parent,
        context,
        links,
        startTime,
        kind,
        options,
      );

      const capture: SpanCapture = {
        name,
        attributes: new Map(),
      };
      capturedSpans.push(capture);

      // Wrap the attribute method to capture attributes
      const originalAttribute = span.attribute.bind(span);
      span.attribute = (key, value) => {
        capture.attributes.set(key, value);
        return originalAttribute(key, value);
      };

      return span;
    },
    context(f, fiber) {
      return defaultTracer.context(f, fiber);
    },
  });
}

describe("auth tracing", () => {
  beforeAll(() => {
    Object.assign(process.env, TEST_ENV);
  });

  describe("sendOtpEmail tracing", () => {
    it("creates a span named auth.sendOtp when sending OTP email", async () => {
      const capturedSpans: SpanCapture[] = [];

      const program = Effect.gen(function* () {
        const defaultTracer = yield* Effect.tracer;
        const testTracer = createTestTracer(defaultTracer, capturedSpans);

        yield* sendOtpEmail("test@example.com", "123456").pipe(
          Effect.withTracer(testTracer),
        );
      });

      await Effect.runPromise(program);

      const authSpan = capturedSpans.find((s) => s.name === "auth.sendOtp");
      expect(authSpan).toBeDefined();
    });

    it("annotates span with email.to attribute", async () => {
      const capturedSpans: SpanCapture[] = [];

      const program = Effect.gen(function* () {
        const defaultTracer = yield* Effect.tracer;
        const testTracer = createTestTracer(defaultTracer, capturedSpans);

        yield* sendOtpEmail("verify-email@example.com", "654321").pipe(
          Effect.withTracer(testTracer),
        );
      });

      await Effect.runPromise(program);

      const authSpan = capturedSpans.find((s) => s.name === "auth.sendOtp");
      expect(authSpan).toBeDefined();
      if (!authSpan) throw new Error("authSpan should be defined");
      expect(authSpan.attributes.get("email.to")).toBe(
        "verify-email@example.com",
      );
    });

    it("does not expose OTP value in span attributes", async () => {
      const capturedSpans: SpanCapture[] = [];
      const secretOtp = "SECRET_OTP_123";

      const program = Effect.gen(function* () {
        const defaultTracer = yield* Effect.tracer;
        const testTracer = createTestTracer(defaultTracer, capturedSpans);

        yield* sendOtpEmail("otp-test@example.com", secretOtp).pipe(
          Effect.withTracer(testTracer),
        );
      });

      await Effect.runPromise(program);

      const authSpan = capturedSpans.find((s) => s.name === "auth.sendOtp");
      expect(authSpan).toBeDefined();
      if (!authSpan) throw new Error("authSpan should be defined");

      // Verify OTP is not exposed in any attribute key or value
      for (const [key, value] of authSpan.attributes) {
        // Check attribute key doesn't contain "otp" (case-insensitive)
        expect(key.toLowerCase()).not.toContain("otp");
        // Check attribute value doesn't contain the actual OTP
        if (typeof value === "string") {
          expect(value).not.toContain(secretOtp);
        }
      }
    });
  });
});
