import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailServiceConsole, EmailServiceTag } from "./email.service";

describe("EmailServiceConsole", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs email to console", async () => {
    await Effect.runPromise(
      EmailServiceTag.pipe(
        Effect.flatMap((service) =>
          service.send({
            to: "user@example.com",
            subject: "Test Subject",
            content: { html: "<p>Hello</p>" },
          }),
        ),
        Effect.provide(EmailServiceConsole),
      ),
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[EMAIL] To: user@example.com"),
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Test Subject"),
    );
  });

  it("resolves successfully without throwing", async () => {
    await expect(
      Effect.runPromise(
        EmailServiceTag.pipe(
          Effect.flatMap((service) =>
            service.send({
              to: "user@example.com",
              subject: "Test",
              content: { html: "<p>Test</p>" },
            }),
          ),
          Effect.provide(EmailServiceConsole),
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it("logs headers when provided", async () => {
    await Effect.runPromise(
      EmailServiceTag.pipe(
        Effect.flatMap((service) =>
          service.send({
            to: "user@example.com",
            subject: "Test",
            content: { html: "<p>Test</p>" },
            headers: {
              "List-Unsubscribe": "<https://gemhog.com/unsubscribe?token=abc>",
            },
          }),
        ),
        Effect.provide(EmailServiceConsole),
      ),
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("List-Unsubscribe"),
    );
  });

  it("truncates long HTML in log output", async () => {
    const longHtml = `<p>${"x".repeat(300)}</p>`;

    await Effect.runPromise(
      EmailServiceTag.pipe(
        Effect.flatMap((service) =>
          service.send({
            to: "user@example.com",
            subject: "Test",
            content: { html: longHtml },
          }),
        ),
        Effect.provide(EmailServiceConsole),
      ),
    );

    const contentLogCall = consoleSpy.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === "string" && call[0].includes("[EMAIL] Content:"),
    );
    expect(contentLogCall).toBeDefined();
    expect(contentLogCall?.[0]).toContain("...");
  });

  it("prefers text over html for console preview", async () => {
    await Effect.runPromise(
      EmailServiceTag.pipe(
        Effect.flatMap((service) =>
          service.send({
            to: "user@example.com",
            subject: "Test",
            content: {
              html: "<p>HTML version</p>",
              text: "Plain text version",
            },
          }),
        ),
        Effect.provide(EmailServiceConsole),
      ),
    );

    const contentLogCall = consoleSpy.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === "string" && call[0].includes("[EMAIL] Content:"),
    );
    expect(contentLogCall).toBeDefined();
    expect(contentLogCall?.[0]).toContain("Plain text version");
    expect(contentLogCall?.[0]).not.toContain("HTML version");
  });
});
