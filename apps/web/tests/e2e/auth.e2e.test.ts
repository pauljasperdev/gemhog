import { expect, test } from "./fixtures";

function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test.describe("Signup flow", () => {
  test("can sign up with email and password", async ({ page }) => {
    const testUser = {
      email: uniqueEmail(),
      password: "password123",
      name: "Test User",
    };

    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Create Account" }),
    ).toBeVisible();

    await page.getByLabel("Name").fill(testUser.name);
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);

    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();

    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    await expect(page.getByText(`Welcome ${testUser.name}`)).toBeVisible();

    await expect(page.getByText("API: This is private")).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("short");

    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();

    await expect(page).toHaveURL("/login");
  });
});

test.describe("Signin flow", () => {
  test("can sign in with existing account", async ({ page }) => {
    const testUser = {
      email: uniqueEmail(),
      password: "password123",
      name: "Signin Test User",
    };

    await page.goto("/login");
    await page.getByLabel("Name").fill(testUser.name);
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();

    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    await page.goto("/login");

    await page
      .getByRole("button", { name: "Already have an account? Sign In" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();

    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);

    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    await expect(page.getByText(`Welcome ${testUser.name}`)).toBeVisible();

    await expect(page.getByText("API: This is private")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByRole("button", { name: "Already have an account? Sign In" })
      .click();

    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("wrongpassword123");

    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/login");
  });
});
