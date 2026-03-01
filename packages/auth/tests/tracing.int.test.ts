import { Effect, Tracer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { sendOtpEmail } from "../src/send-otp";

const TEST_ENV = {
  LOCAL_ENV: "1",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  DATABASE_URL_POOLER: "postgresql://test:test@localhost:5432/test",
  BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
  BETTER_AUTH_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "test-google-api-key",
  SENTRY_DSN: "https://key@sentry.io/123",
  RESEND_API_KEY: "test-resend-api-key",
};

interface CapturedSpan {
  name: string;
  spanRef: object | null;
  parentRef: object | null;
}

function toSpanRef(span: unknown): object | null {
  if (typeof span === "object" && span !== null && "_tag" in span) {
    const tag = (span as { _tag: unknown })._tag;
    if (tag === "None") return null;
    if (tag === "Some" && "value" in span) {
      return toSpanRef((span as { value: unknown }).value);
    }
  }

  return typeof span === "object" && span !== null ? span : null;
}

function createCapturingTracer(
  defaultTracer: Tracer.Tracer,
  capturedSpans: CapturedSpan[],
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

      capturedSpans.push({
        name,
        spanRef: toSpanRef(span),
        parentRef: toSpanRef(parent),
      });

      return span;
    },
    context(f, fiber) {
      return defaultTracer.context(f, fiber);
    },
  });
}

describe("auth tracing integration", () => {
  beforeAll(() => {
    Object.assign(process.env, TEST_ENV);
  });

  it("verifies auth.sendOtp parent-child spans in auth flow", async () => {
    const capturedSpans: CapturedSpan[] = [];

    const program = Effect.gen(function* () {
      const defaultTracer = yield* Effect.tracer;
      const testTracer = createCapturingTracer(defaultTracer, capturedSpans);

      yield* sendOtpEmail("test@example.com", "123456").pipe(
        Effect.withSpan("test.auth.flow"),
        Effect.withTracer(testTracer),
      );
    });

    await Effect.runPromise(program);

    const outerSpan = capturedSpans.find(
      (span) => span.name === "test.auth.flow",
    );
    const authSpan = capturedSpans.find((span) => span.name === "auth.sendOtp");
    const emailSpan = capturedSpans.find(
      (span) =>
        span.name === "email.console.send" || span.name === "email.resend.send",
    );

    expect(outerSpan).toBeDefined();
    expect(authSpan).toBeDefined();
    expect(emailSpan).toBeDefined();

    if (!outerSpan || !authSpan || !emailSpan) {
      throw new Error("Expected outer, auth, and email spans to be captured");
    }

    expect(authSpan.parentRef).toBe(outerSpan.spanRef);
    expect(emailSpan.parentRef).toBe(authSpan.spanRef);
  });
});
