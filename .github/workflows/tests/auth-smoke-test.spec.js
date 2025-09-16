// Authentication Smoke Test - Critical Path Validation
// Prevents gotrue-class authentication failures from reaching production
// Tests the complete authentication flow with real credentials

import { test, expect } from '@playwright/test';

// Test credentials defined in CLAUDE.md
const TEST_EMAIL = 'parents@nestsync.com';
const TEST_PASSWORD = 'Shazam11#';

test.describe('Authentication Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error and console monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  test('Critical Path: User can sign in successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*login/);

    // Wait for login form to be visible
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Sign in to continue managing your little one\'s needs')).toBeVisible();

    // Fill in authentication credentials
    await page.getByRole('textbox', { name: /enter your email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /enter your password/i }).fill(TEST_PASSWORD);

    // Submit authentication
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeEnabled();
    await signInButton.click();

    // Verify no authentication errors are displayed
    await expect(page.locator('text=validation error for Session')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=identity_id Field required')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Signature has expired')).not.toBeVisible({ timeout: 5000 });

    // Wait for successful authentication redirect
    await expect(page).toHaveURL(/.*\/(dashboard|planner|home)/);

    // Verify user interface is accessible
    await expect(page.getByText('Dashboard')).toBeVisible({ timeout: 10000 });

    // Take screenshot for validation
    await page.screenshot({ path: 'auth-success-verification.png', fullPage: true });
  });

  test('Authentication API Endpoint Validation', async ({ page }) => {
    // Test GraphQL endpoint is accessible
    const response = await page.request.post('http://localhost:8001/graphql', {
      data: {
        query: '{ __schema { types { name } } }'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.__schema).toBeDefined();
    expect(data.data.__schema.types).toBeInstanceOf(Array);
  });

  test('Backend Health Check', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
  });

  test('Dependency Version Validation', async ({ page }) => {
    // This test will be enhanced with actual version checking
    // For now, validate that authentication endpoints respond correctly
    const response = await page.request.post('http://localhost:8001/graphql', {
      data: {
        query: `
          mutation TestAuth($email: String!, $password: String!) {
            signIn(input: { email: $email, password: $password }) {
              success
              message
            }
          }
        `,
        variables: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should not have Pydantic validation errors
    expect(data.errors).toBeUndefined();

    // Should have successful authentication
    if (data.data && data.data.signIn) {
      expect(data.data.signIn.success).toBe(true);
    }
  });

  test('Analytics Dashboard Access After Authentication', async ({ page }) => {
    // Navigate and authenticate
    await page.goto('/');
    await page.getByRole('textbox', { name: /enter your email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /enter your password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect
    await expect(page).toHaveURL(/.*\/(dashboard|planner|home)/);

    // Navigate to analytics (planner tab)
    await page.getByRole('tab', { name: /planner/i }).click();

    // Verify analytics view loads without gotrue errors
    await expect(page.getByText('Analytics')).toBeVisible({ timeout: 10000 });

    // Verify no authentication-related errors
    await expect(page.locator('text=Unable to load analytics')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Network request failed')).not.toBeVisible({ timeout: 5000 });

    // Take screenshot for validation
    await page.screenshot({ path: 'analytics-access-verification.png', fullPage: true });
  });
});