// UNIQUE_MARKER_EMAIL_12345
import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import * as Effect from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailServiceConsole } from "../src/console";
import { EmailServiceLive } from "../src/resend";
import { EmailService } from "../src/service";

// Mock the Resend SDK to avoid real HTTP calls
// Named function expression: biome does not convert named functions to arrows,
// and vitest SSR mode requires a non-arrow function to use as a constructor (new Resend(...)).
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function mockResend() {
    return {
      emails: {
        send: vi
          .fn()
          .mockResolvedValue({ data: { id: "mock-id" }, error: null }),
      },
    };
  }),
}));

// Set API key for EmailServiceLive config
process.env.RESEND_API_KEY = "test-key";

describe("Email Tracing", () => {
  let exporter: InMemorySpanExporter;
  let tracerLayer: Effect.Layer.Layer<never>;

  beforeEach(() => {
    exporter = new InMemorySpanExporter();
    tracerLayer = NodeSdk.layer(() => ({
      resource: { serviceName: "test" },
      spanProcessor: new SimpleSpanProcessor(exporter),
    }));
    exporter.reset();
  });

  it("EmailServiceConsole creates email.console.send span", async () => {
    // IMPORTANT: Read spans INSIDE the Effect scope, before NodeSdk shuts down
    // the exporter (which clears _finishedSpans on shutdown).
    const { spanNames, emailToAttr } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        yield* EmailService.pipe(
          Effect.Effect.flatMap((service) =>
            service.send("to@example.com", {
              subject: "Test Subject",
              html: "<p>Hello</p>",
              text: "Hello",
            }),
          ),
        );
        const spans = exporter.getFinishedSpans();
        const emailSpan = spans.find((s) => s.name === "email.console.send");
        return {
          spanNames: spans.map((s) => s.name),
          emailToAttr: emailSpan?.attributes?.["email.to"] ?? null,
        };
      }).pipe(
        Effect.Effect.provide(
          Effect.Layer.mergeAll(EmailServiceConsole, tracerLayer),
        ),
      ),
    );

    expect(spanNames).toContain("email.console.send");
    expect(emailToAttr).toBe("to@example.com");
  });

  it("EmailServiceLive creates email.resend.send span", async () => {
    const { spanNames, emailToAttr } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        yield* EmailService.pipe(
          Effect.Effect.flatMap((service) =>
            service.send("to@example.com", {
              subject: "Test Subject",
              html: "<p>Hello</p>",
              text: "Hello",
            }),
          ),
        );
        const spans = exporter.getFinishedSpans();
        const emailSpan = spans.find((s) => s.name === "email.resend.send");
        return {
          spanNames: spans.map((s) => s.name),
          emailToAttr: emailSpan?.attributes?.["email.to"] ?? null,
        };
      }).pipe(
        Effect.Effect.provide(
          Effect.Layer.mergeAll(EmailServiceLive, tracerLayer),
        ),
      ),
    );

    expect(spanNames).toContain("email.resend.send");
    expect(emailToAttr).toBe("to@example.com");
  });
});
