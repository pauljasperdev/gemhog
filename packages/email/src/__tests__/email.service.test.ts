import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmailService, EmailServiceConsole } from "../service";

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
      EmailService.pipe(
        Effect.flatMap((service) =>
          service.send({
            to: "user@example.com",
            email: {
              subject: "Test Subject",
              html: "<p>Hello</p>",
              text: "Hello",
            },
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
        EmailService.pipe(
          Effect.flatMap((service) =>
            service.send({
              to: "user@example.com",
              email: { subject: "Test", html: "<p>Test</p>", text: "Test" },
            }),
          ),
          Effect.provide(EmailServiceConsole),
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it("logs headers when provided", async () => {
    await Effect.runPromise(
      EmailService.pipe(
        Effect.flatMap((service) =>
          service.send({
            to: "user@example.com",
            email: { subject: "Test", html: "<p>Test</p>", text: "Test" },
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
});
