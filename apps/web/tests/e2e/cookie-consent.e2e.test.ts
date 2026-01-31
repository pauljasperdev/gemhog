import { expect, test } from "./fixtures";

test.describe("Cookie consent banner", () => {
  test("banner appears on first visit when PostHog is configured", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByRole("dialog", { name: "Cookie consent" });
    await expect(banner).toBeVisible();

    // Banner content
    await expect(page.getByText("Would you like a cookie?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline" })).toBeVisible();
  });

  test("accept dismisses banner", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: "Cookie consent" });
    await expect(banner).toBeVisible();

    await page.getByRole("button", { name: "Accept" }).click();
    await expect(banner).not.toBeVisible();
  });

  test("decline dismisses banner", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: "Cookie consent" });
    await expect(banner).toBeVisible();

    await page.getByRole("button", { name: "Decline" }).click();
    await expect(banner).not.toBeVisible();
  });
});
