import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import { beforeEach, describe, expect, it } from "@effect/vitest";
import { EmailService } from "@gemhog/email";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import * as Effect from "effect";
import { SubscriberRepositoryError } from "../src/errors";
import { SubscriberRepository } from "../src/repository";
import { SubscriberService } from "../src/service";
import { SubscriberServiceLive } from "../src/service.live";
import type { Subscriber } from "../src/sql";

// Set required environment variables for config
process.env.APP_URL = process.env.APP_URL ?? "http://localhost:3001";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-secret-at-least-32-characters-long";

function makeTestSubscriber(overrides?: Partial<Subscriber>): Subscriber {
  return {
    id: overrides?.id ?? "test-id",
    email: overrides?.email ?? "test@example.com",
    status: overrides?.status ?? "pending",
    subscribedAt: overrides?.subscribedAt ?? new Date(),
    verifiedAt: overrides?.verifiedAt ?? null,
    unsubscribedAt: overrides?.unsubscribedAt ?? null,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

describe("Subscriber Service Span Tracing", () => {
  let exporter: InMemorySpanExporter;
  let tracerLayer: Effect.Layer.Layer<never>;

  beforeEach(() => {
    exporter = new InMemorySpanExporter();
    tracerLayer = NodeSdk.layer(() => ({
      resource: { serviceName: "test" },
      spanProcessor: new SimpleSpanProcessor(exporter),
    }));
  });

  it("subscribe creates subscriber.service.subscribe span with email attribute", async () => {
    const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
      createSubscriber: (_email) =>
        Effect.Effect.succeed(makeTestSubscriber({ email: _email })),
      readSubscriberById: (_id) => Effect.Effect.succeed(makeTestSubscriber()),
      readSubscriberByEmail: (_email) =>
        Effect.Effect.succeed(makeTestSubscriber()),
      updateSubscriberById: (_id, _updates) =>
        Effect.Effect.succeed(makeTestSubscriber()),
    });

    const TestEmailLayer = Effect.Layer.succeed(EmailService, {
      send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
    });

    const TestLayers = Effect.Layer.mergeAll(
      SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      ),
      tracerLayer,
    );

    const result = await Effect.Effect.runPromise(
      SubscriberService.pipe(
        Effect.Effect.flatMap((service) =>
          service.subscribe("test@example.com"),
        ),
        Effect.Effect.provide(TestLayers),
        Effect.Effect.either,
      ),
    );

    expect(result._tag).toBe("Right");

    const spans = exporter.getFinishedSpans();
    const spanNames = spans.map((s) => s.name);

    // Assert span name exists
    expect(spanNames).toContain("subscriber.service.subscribe");

    // Assert span has email attribute
    const subscribeSpan = spans.find(
      (s) => s.name === "subscriber.service.subscribe",
    );
    expect(subscribeSpan).toBeDefined();
    expect(subscribeSpan?.attributes).toEqual(
      expect.objectContaining({
        email: "test@example.com",
      }),
    );
  });

  it("verify creates subscriber.service.verify span with subscriberId attribute", async () => {
    const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
      createSubscriber: (_email) => Effect.Effect.succeed(makeTestSubscriber()),
      readSubscriberById: (_id) =>
        Effect.Effect.succeed(makeTestSubscriber({ id: _id })),
      readSubscriberByEmail: (_email) =>
        Effect.Effect.succeed(makeTestSubscriber()),
      updateSubscriberById: (_id, _updates) =>
        Effect.Effect.succeed(makeTestSubscriber({ id: _id })),
    });

    const TestEmailLayer = Effect.Layer.succeed(EmailService, {
      send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
    });

    const TestLayers = Effect.Layer.mergeAll(
      SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      ),
      tracerLayer,
    );

    const result = await Effect.Effect.runPromise(
      SubscriberService.pipe(
        Effect.Effect.flatMap((service) => service.verify("test-id")),
        Effect.Effect.provide(TestLayers),
        Effect.Effect.either,
      ),
    );

    expect(result._tag).toBe("Right");

    const spans = exporter.getFinishedSpans();
    const spanNames = spans.map((s) => s.name);

    // Assert span name exists
    expect(spanNames).toContain("subscriber.service.verify");

    // Assert span has subscriberId attribute
    const verifySpan = spans.find(
      (s) => s.name === "subscriber.service.verify",
    );
    expect(verifySpan).toBeDefined();
    expect(verifySpan?.attributes).toEqual(
      expect.objectContaining({
        subscriberId: "test-id",
      }),
    );
  });

  it("unsubscribe creates subscriber.service.unsubscribe span with subscriberId attribute", async () => {
    const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
      createSubscriber: (_email) => Effect.Effect.succeed(makeTestSubscriber()),
      readSubscriberById: (_id) =>
        Effect.Effect.succeed(makeTestSubscriber({ id: _id })),
      readSubscriberByEmail: (_email) =>
        Effect.Effect.succeed(makeTestSubscriber()),
      updateSubscriberById: (_id, _updates) =>
        Effect.Effect.succeed(makeTestSubscriber({ id: _id })),
    });

    const TestEmailLayer = Effect.Layer.succeed(EmailService, {
      send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
    });

    const TestLayers = Effect.Layer.mergeAll(
      SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      ),
      tracerLayer,
    );

    const result = await Effect.Effect.runPromise(
      SubscriberService.pipe(
        Effect.Effect.flatMap((service) => service.unsubscribe("test-id")),
        Effect.Effect.provide(TestLayers),
        Effect.Effect.either,
      ),
    );

    expect(result._tag).toBe("Right");

    const spans = exporter.getFinishedSpans();
    const spanNames = spans.map((s) => s.name);

    // Assert span name exists
    expect(spanNames).toContain("subscriber.service.unsubscribe");

    // Assert span has subscriberId attribute
    const unsubscribeSpan = spans.find(
      (s) => s.name === "subscriber.service.unsubscribe",
    );
    expect(unsubscribeSpan).toBeDefined();
    expect(unsubscribeSpan?.attributes).toEqual(
      expect.objectContaining({
        subscriberId: "test-id",
      }),
    );
  });

  it("subscribe span is created even when operation fails", async () => {
    const TestRepoLayer = Effect.Layer.succeed(SubscriberRepository, {
      createSubscriber: (_email) =>
        Effect.Effect.fail(
          new SubscriberRepositoryError({
            cause: new Error("Database error"),
          }),
        ),
      readSubscriberById: (_id) => Effect.Effect.succeed(makeTestSubscriber()),
      readSubscriberByEmail: (_email) =>
        Effect.Effect.succeed(makeTestSubscriber()),
      updateSubscriberById: (_id, _updates) =>
        Effect.Effect.succeed(makeTestSubscriber()),
    });

    const TestEmailLayer = Effect.Layer.succeed(EmailService, {
      send: (_to, _content, _headers) => Effect.Effect.succeed(undefined),
    });

    const TestLayers = Effect.Layer.mergeAll(
      SubscriberServiceLive.pipe(
        Effect.Layer.provide(TestRepoLayer),
        Effect.Layer.provide(TestEmailLayer),
      ),
      tracerLayer,
    );

    const result = await Effect.Effect.runPromise(
      SubscriberService.pipe(
        Effect.Effect.flatMap((service) =>
          service.subscribe("test@example.com"),
        ),
        Effect.Effect.provide(TestLayers),
        Effect.Effect.either,
      ),
    );

    expect(result._tag).toBe("Left");

    const spans = exporter.getFinishedSpans();
    // Even on failure, span should be created
    expect(spans.length).toBeGreaterThan(0);
  });
});
