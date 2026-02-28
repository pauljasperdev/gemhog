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
    const program = EmailService.pipe(
      Effect.Effect.flatMap((service) =>
        service.send("to@example.com", {
          subject: "Test Subject",
          html: "<p>Hello</p>",
          text: "Hello",
        }),
      ),
      Effect.Effect.provide(
        Effect.Layer.mergeAll(EmailServiceConsole, tracerLayer),
      ),
      Effect.Effect.either,
    );

    const result = await Effect.Effect.runPromise(program);
    expect(result).toBeDefined();

    const spans = exporter.getFinishedSpans();
    const spanNames = spans.map((s) => s.name);

    // This will FAIL because current implementation uses "email.send"
    // but test expects "email.console.send"
    expect(spanNames).toContain("email.console.send");

    // Verify email.to attribute is set
    const emailSpan = spans.find((s) => s.name === "email.console.send");
    expect(emailSpan?.attributes?.["email.to"]).toBe("to@example.com");
  });

  it("EmailServiceLive creates email.resend.send span", async () => {
    // Mock the Resend SDK to avoid real HTTP calls
    vi.mock("resend", () => ({
      Resend: vi.fn().mockImplementation(() => ({
        emails: {
          send: vi
            .fn()
            .mockResolvedValue({ data: { id: "mock-id" }, error: null }),
        },
      })),
    }));

    // Set API key for config
    process.env.RESEND_API_KEY = "test-key";

    const program = EmailService.pipe(
      Effect.Effect.flatMap((service) =>
        service.send("to@example.com", {
          subject: "Test Subject",
          html: "<p>Hello</p>",
          text: "Hello",
        }),
      ),
      Effect.Effect.provide(
        Effect.Layer.mergeAll(EmailServiceLive, tracerLayer),
      ),
      Effect.Effect.either,
    );

    const result = await Effect.Effect.runPromise(program);
    expect(result).toBeDefined();

    const spans = exporter.getFinishedSpans();
    const spanNames = spans.map((s) => s.name);

    // This will FAIL because current implementation uses "email.send"
    // but test expects "email.resend.send"
    expect(spanNames).toContain("email.resend.send");

    // Verify email.to attribute is set
    const emailSpan = spans.find((s) => s.name === "email.resend.send");
    expect(emailSpan?.attributes?.["email.to"]).toBe("to@example.com");
  });
});
