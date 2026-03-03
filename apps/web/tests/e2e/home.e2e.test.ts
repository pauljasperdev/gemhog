// E2E tests using error-detecting fixture (captures console errors and page exceptions)
import { expect, test } from "./fixtures";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  // Verify the page loads without error
  await expect(page).toHaveURL("/");
  // Verify the landing page H1 is visible (structural: h1 element)
  await expect(page.locator("h1")).toBeVisible();
});

test("page has content", async ({ page }) => {
  await page.goto("/");
  // Verify email input and submit button are visible (structural selectors)
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await expect(page.locator('button[type="submit"]').first()).toBeVisible();
});

test("subscribe form is visible", async ({ page }) => {
  await page.goto("/");
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible();
  const submitButton = page.locator('button[type="submit"]').first();
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
});

test("footer has privacy and cookie links", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.locator('a[href="/privacy"]')).toBeVisible();
  await expect(footer.getByRole("button")).toBeVisible();
});
