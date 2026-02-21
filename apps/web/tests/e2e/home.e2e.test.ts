// E2E tests using error-detecting fixture (captures console errors and page exceptions)
import { expect, test } from "./fixtures";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  // Verify the page loads without error
  await expect(page).toHaveURL("/");
  // Verify the landing page H1 is visible
  await expect(
    page.getByRole("heading", {
      name: /we listen to investment podcasts/i,
    }),
  ).toBeVisible();
});

test("page has content", async ({ page }) => {
  await page.goto("/");
  // Verify email input and submit button are visible
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /get the free newsletter/i }),
  ).toBeVisible();
});

test("subscribe form is visible", async ({ page }) => {
  await page.goto("/");
  const emailInput = page.getByLabel("Email address");
  await expect(emailInput).toBeVisible();
  const submitButton = page.getByRole("button", {
    name: /get the free newsletter/i,
  });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
});

test("footer has privacy and cookie links", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("link", { name: /privacy policy/i }),
  ).toBeVisible();
  await expect(
    footer.getByRole("button", { name: /cookie settings/i }),
  ).toBeVisible();
});
