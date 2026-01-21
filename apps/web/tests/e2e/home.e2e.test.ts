// E2E tests using error-detecting fixture (captures console errors and page exceptions)
import { expect, test } from "./fixtures";

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
