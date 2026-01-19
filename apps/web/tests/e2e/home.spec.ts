// apps/web/tests/e2e/home.spec.ts
import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  // Verify the page loads without error
  await expect(page).toHaveURL("/");
});

test("page has content", async ({ page }) => {
  await page.goto("/");
  // Basic check that something renders
  const body = page.locator("body");
  await expect(body).toBeVisible();
});
