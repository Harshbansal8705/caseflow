import { test, expect } from "@playwright/test";

test.describe("Import Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Generate email once and reuse it
    const testEmail = `test-${Date.now()}@example.com`;

    // Register a test user
    await page.goto("/register");

    // Fill registration form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "TestPassword123");
    await page.fill('input[name="confirmPassword"]', "TestPassword123");

    // Submit and wait for redirect
    await page.click('button[type="submit"]');
    await page.waitForURL("/login*", { timeout: 10000 });

    // Now login with the SAME email
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "TestPassword123");
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect
    await page.waitForURL(/\/(dashboard|import|cases)/, { timeout: 10000 });
  });

  test("should show upload page", async ({ page }) => {
    await page.goto("/import");
    // Use heading role to be specific
    await expect(
      page.getByRole("heading", { name: "Import CSV" })
    ).toBeVisible();
    await expect(page.getByText("Drag & drop your CSV file")).toBeVisible();
  });

  test("should navigate to dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Use heading role to be specific
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("should navigate to cases list", async ({ page }) => {
    await page.goto("/cases");
    // Use heading role to be specific
    await expect(page.getByRole("heading", { name: "Cases" })).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome to CaseFlow")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("should show registration page", async ({ page }) => {
    await page.goto("/register");
    // Use heading role to be more specific
    await expect(
      page.getByRole("heading", { name: "Create Account" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });
});
