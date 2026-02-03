import { expect, test } from "./fixtures";

test.describe("Auth access", () => {
  test("redirects unauthenticated login to home", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveURL("/");
  });
});
