import * as Effect from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmailServiceConsole } from "../src/console";
import { EmailService } from "../src/service";

describe("EmailServiceConsole", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs email to console", async () => {
    await Effect.Effect.runPromise(
      EmailService.pipe(
        Effect.Effect.flatMap((service) =>
          service.send("user@example.com", {
            subject: "Test Subject",
            html: "<p>Hello</p>",
            text: "Hello",
          }),
        ),
        Effect.Effect.provide(EmailServiceConsole),
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
      Effect.Effect.runPromise(
        EmailService.pipe(
          Effect.Effect.flatMap((service) =>
            service.send("user@example.com", {
              subject: "Test",
              html: "<p>Test</p>",
              text: "Test",
            }),
          ),
          Effect.Effect.provide(EmailServiceConsole),
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it("logs headers when provided", async () => {
    await Effect.Effect.runPromise(
      EmailService.pipe(
        Effect.Effect.flatMap((service) =>
          service.send(
            "user@example.com",
            { subject: "Test", html: "<p>Test</p>", text: "Test" },
            {
              "List-Unsubscribe": "<https://gemhog.com/unsubscribe?token=abc>",
            },
          ),
        ),
        Effect.Effect.provide(EmailServiceConsole),
      ),
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("List-Unsubscribe"),
    );
  });
});
