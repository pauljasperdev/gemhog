import { test as base, expect } from "@playwright/test";

/**
 * Extended Playwright test fixture with error detection.
 *
 * Automatically captures:
 * - Console errors (console.error)
 * - Page exceptions (unhandled JavaScript errors)
 *
 * Tests will fail if any errors are captured, ensuring we catch
 * runtime errors that URL/visibility checks would miss.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`[console] ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push(`[page] ${error.message}`);
    });

    await use(page);

    expect(errors, "No page errors expected").toStrictEqual([]);
  },
});

export { expect };
