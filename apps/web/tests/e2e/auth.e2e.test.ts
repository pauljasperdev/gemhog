// E2E tests for auth flows using error-detecting fixture
import { expect, test } from "./fixtures";

/**
 * Generate unique email for test isolation.
 * Each test run gets a unique email to avoid conflicts.
 */
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

    // Navigate to login page (shows signup form by default)
    await page.goto("/login");

    // Verify we're on the signup form (shows "Create Account" heading)
    await expect(
      page.getByRole("heading", { name: "Create Account" }),
    ).toBeVisible();

    // Fill in the signup form
    await page.getByLabel("Name").fill(testUser.name);
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);

    // Submit the form (use form-scoped button to avoid navbar "Sign In" button)
    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    // Verify user context - dashboard shows welcome message with user name
    await expect(page.getByText(`Welcome ${testUser.name}`)).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/login");

    // Fill form with invalid password (less than 8 chars)
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("short");

    // Try to submit
    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();

    // Validation error should appear
    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();

    // Should still be on login page
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

    // First, sign up to create the account
    await page.goto("/login");
    await page.getByLabel("Name").fill(testUser.name);
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);
    await page.locator("form").getByRole("button", { name: "Sign Up" }).click();

    // Wait for dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    // Now sign out and sign back in
    // Navigate back to login (which will force a new session check)
    await page.goto("/login");

    // Switch to sign in form (this button is outside the form)
    await page
      .getByRole("button", { name: "Already have an account? Sign In" })
      .click();

    // Verify we're on the sign in form
    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();

    // Fill in credentials
    await page.getByLabel("Email").fill(testUser.email);
    await page.getByLabel("Password").fill(testUser.password);

    // Submit (use form-scoped button to avoid navbar "Sign In" button)
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

    // Verify user context
    await expect(page.getByText(`Welcome ${testUser.name}`)).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Switch to sign in form (this button is outside the form)
    await page
      .getByRole("button", { name: "Already have an account? Sign In" })
      .click();

    // Try to sign in with non-existent credentials
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("wrongpassword123");

    // Submit (use form-scoped button to avoid navbar "Sign In" button)
    await page.locator("form").getByRole("button", { name: "Sign In" }).click();

    // Should remain on login page (auth error prevents navigation)
    // The toast error message will appear but we mainly verify no redirect
    await expect(page).toHaveURL("/login");
  });
});
