import { expect, test } from "./fixtures";

test.describe("Auth access", () => {
  test("sign-in is the auth entry point", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page).toHaveURL("/sign-in");
  });

  test("sign-in page loads with email input", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send code/i }),
    ).toBeVisible();
  });

  test("unauthenticated access to /admin redirects to /sign-in", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL("/sign-in");
  });

  test("landing page nav has Sign In link", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test('sign-in page heading is "Sign In" (not admin-specific)', async ({
    page,
  }) => {
    await page.goto("/sign-in");

    const title = page.locator('[data-slot="card-title"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveText("Sign In");
  });
});
