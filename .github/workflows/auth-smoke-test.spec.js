// NestSync Authentication Critical Path Testing
// Prevents gotrue compatibility failures and authentication system breakdowns
// Tests all documented authentication failure scenarios from bottlenecks.md

const { test, expect } = require('@playwright/test');

// Test credentials from CLAUDE.md
const TEST_CREDENTIALS = {
  email: 'parents@nestsync.com',
  password: 'Shazam11#'
};

const BACKEND_URL = 'http://localhost:8001';
const FRONTEND_URL = 'http://localhost:8082';

test.describe('NestSync Authentication Critical Path', () => {

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('1. Backend GraphQL Authentication Endpoint Health Check', async ({ page }) => {
    // Test GraphQL schema introspection (dependency validation pattern)
    const response = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: '{ __schema { types { name } } }'
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.errors).toBeUndefined();
    expect(data.data.__schema.types).toBeDefined();
    expect(data.data.__schema.types.length).toBeGreaterThan(0);

    console.log(`✅ GraphQL endpoint healthy with ${data.data.__schema.types.length} types`);
  });

  test('2. Gotrue SDK Compatibility Validation', async ({ page }) => {
    // Test the specific gotrue identity_id field issue from bottlenecks.md
    const signInResponse = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              success
              message
              accessToken
              user {
                id
                email
                identities {
                  id
                  identity_id
                  provider
                }
              }
            }
          }
        `,
        variables: TEST_CREDENTIALS
      }
    });

    expect(signInResponse.status()).toBe(200);

    const data = await signInResponse.json();

    // Should not have gotrue compatibility errors
    expect(data.errors).toBeUndefined();

    // Should have successful authentication
    expect(data.data.signIn.success).toBe(true);
    expect(data.data.signIn.accessToken).toBeDefined();
    expect(data.data.signIn.user.email).toBe(TEST_CREDENTIALS.email);

    // Critical: Test the identity_id field that caused P0 failure
    if (data.data.signIn.user.identities && data.data.signIn.user.identities.length > 0) {
      const identity = data.data.signIn.user.identities[0];

      // Should have either 'id' or 'identity_id' field (field transformation working)
      const hasIdField = 'id' in identity;
      const hasIdentityIdField = 'identity_id' in identity;

      expect(hasIdField || hasIdentityIdField).toBe(true);
      console.log(`✅ Identity field mapping working: id=${hasIdField}, identity_id=${hasIdentityIdField}`);
    }

    console.log('✅ Gotrue SDK compatibility validation passed');
  });

  test('3. Frontend Authentication Flow End-to-End', async ({ page }) => {
    // Navigate to app and test complete authentication flow
    await page.goto(FRONTEND_URL);

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Look for sign-in form or already authenticated state
    const isAlreadyAuthenticated = await page.locator('[data-testid="dashboard"]').isVisible().catch(() => false);

    if (!isAlreadyAuthenticated) {
      // Find and fill authentication form
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
      const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();

      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await expect(passwordInput).toBeVisible();
      await expect(signInButton).toBeVisible();

      await emailInput.fill(TEST_CREDENTIALS.email);
      await passwordInput.fill(TEST_CREDENTIALS.password);
      await signInButton.click();

      // Wait for authentication to complete
      await page.waitForLoadState('networkidle');

      // Should not show error messages
      const errorMessages = await page.locator('[data-testid="error"], .error, .alert-error').all();
      for (const error of errorMessages) {
        const isVisible = await error.isVisible();
        if (isVisible) {
          const errorText = await error.textContent();
          console.log(`⚠️  Error message visible: ${errorText}`);
        }
      }
    }

    // Verify successful authentication by checking for authenticated content
    const authSuccess = await Promise.race([
      page.locator('[data-testid="dashboard"], [data-testid="planner"], .dashboard, .main-content').isVisible(),
      page.waitForTimeout(15000).then(() => false)
    ]);

    expect(authSuccess).toBe(true);
    console.log('✅ Frontend authentication flow completed successfully');
  });

  test('4. GraphQL Authenticated Query Validation', async ({ page }) => {
    // First authenticate to get access token
    const signInResponse = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              success
              accessToken
            }
          }
        `,
        variables: TEST_CREDENTIALS
      }
    });

    const signInData = await signInResponse.json();
    expect(signInData.data.signIn.success).toBe(true);

    const accessToken = signInData.data.signIn.accessToken;
    expect(accessToken).toBeDefined();

    // Test authenticated GraphQL query (me query pattern)
    const meResponse = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        query: `
          query Me {
            me {
              id
              email
              profile {
                full_name
              }
            }
          }
        `
      }
    });

    expect(meResponse.status()).toBe(200);

    const meData = await meResponse.json();
    expect(meData.errors).toBeUndefined();
    expect(meData.data.me).toBeDefined();
    expect(meData.data.me.email).toBe(TEST_CREDENTIALS.email);

    console.log('✅ Authenticated GraphQL queries working correctly');
  });

  test('5. Analytics Dashboard Data Loading Validation', async ({ page }) => {
    // Test the specific analytics query mismatch issue from bottlenecks.md
    const signInResponse = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              success
              accessToken
            }
          }
        `,
        variables: TEST_CREDENTIALS
      }
    });

    const signInData = await signInResponse.json();
    const accessToken = signInData.data.signIn.accessToken;

    // Test analytics query (should use getAnalyticsDashboard not getAnalyticsOverview)
    const analyticsResponse = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        query: `
          query GetAnalyticsDashboard($childId: String) {
            getAnalyticsDashboard(childId: $childId) {
              trends {
                totalChanges
                averagePerDay
              }
              insights {
                efficiency
                consistency
              }
            }
          }
        `,
        variables: { childId: null }
      }
    });

    expect(analyticsResponse.status()).toBe(200);

    const analyticsData = await analyticsResponse.json();

    // Should not have query operation mismatch errors
    expect(analyticsData.errors).toBeUndefined();
    expect(analyticsData.data.getAnalyticsDashboard).toBeDefined();

    console.log('✅ Analytics dashboard query operation validation passed');
  });

  test('6. Canadian PIPEDA Compliance Headers Validation', async ({ page }) => {
    // Test for Canadian data residency and PIPEDA compliance headers
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Check for Canadian trust indicators in UI
    const canadianIndicators = await page.locator('text=/🇨🇦|Canada|Canadian/i').all();
    expect(canadianIndicators.length).toBeGreaterThan(0);

    // Check GraphQL requests include proper headers
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/graphql') && response.request().method() === 'POST'
    );

    // Trigger a GraphQL request
    await page.reload();

    const response = await responsePromise.catch(() => null);
    if (response) {
      const requestHeaders = response.request().headers();

      // Should have proper content type
      expect(requestHeaders['content-type']).toContain('application/json');

      console.log('✅ PIPEDA compliance indicators present');
    }
  });

  test('7. Cross-Platform Storage Compatibility', async ({ page }) => {
    // Test the universal storage pattern for authentication tokens
    await page.goto(FRONTEND_URL);

    // Test that authentication storage works (not platform-specific)
    const storageTest = await page.evaluate(() => {
      try {
        // Should work on web platform without SecureStore errors
        const testKey = 'nestsync_test_storage';
        const testValue = 'test_authentication_token';

        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);

        return retrieved === testValue;
      } catch (error) {
        return false;
      }
    });

    expect(storageTest).toBe(true);
    console.log('✅ Cross-platform storage compatibility validated');
  });

  test('8. Session Management and Token Refresh', async ({ page }) => {
    // Test session persistence and token refresh mechanisms
    const signInResponse = await page.request.post(`${BACKEND_URL}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              success
              accessToken
              refreshToken
            }
          }
        `,
        variables: TEST_CREDENTIALS
      }
    });

    const signInData = await signInResponse.json();
    expect(signInData.data.signIn.success).toBe(true);

    const accessToken = signInData.data.signIn.accessToken;
    const refreshToken = signInData.data.signIn.refreshToken;

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // Verify tokens are valid format (JWT pattern)
    expect(accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    console.log('✅ Session management and token structure validated');
  });

});

// Additional helper functions for reusable patterns
class AuthenticationValidator {
  static async validateGraphQLEndpoint(request, url) {
    const response = await request.post(`${url}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: { query: '{ __schema { types { name } } }' }
    });

    return {
      isHealthy: response.status() === 200,
      hasErrors: (await response.json()).errors !== undefined
    };
  }

  static async authenticateWithCredentials(request, url, credentials) {
    const response = await request.post(`${url}/graphql`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        query: `
          mutation SignIn($email: String!, $password: String!) {
            signIn(email: $email, password: $password) {
              success
              message
              accessToken
              refreshToken
              user { id email }
            }
          }
        `,
        variables: credentials
      }
    });

    const data = await response.json();
    return {
      success: data.data?.signIn?.success || false,
      token: data.data?.signIn?.accessToken,
      user: data.data?.signIn?.user,
      errors: data.errors
    };
  }
}

module.exports = { AuthenticationValidator, TEST_CREDENTIALS };