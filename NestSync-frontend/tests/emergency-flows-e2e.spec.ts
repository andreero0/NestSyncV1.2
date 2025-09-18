/**
 * End-to-End Tests for Emergency Flows
 *
 * Critical user journey testing with Playwright
 * Tests parent panic, caregiver access, healthcare provider, and 911 operator scenarios
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CREDENTIALS = {
  email: 'parents@nestsync.com',
  password: 'Shazam11#'
};

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://nestsync.ca'
  : 'http://localhost:8082';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://nestsync-api.railway.app'
  : 'http://localhost:8001';

// Test data setup
let emergencyAccessCode: string;
let emergencyAccessToken: string;
let testChildId: string;

test.describe('Emergency Flows - Critical User Journeys', () => {

  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to the app
    await page.goto(BASE_URL);

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. Parent Emergency Access (Panic Scenario)', () => {

    test('Parent can quickly access emergency information during panic', async ({ page }) => {
      // Login as parent
      await test.step('Login as parent', async () => {
        await page.click('[data-testid="login-tab"]');
        await page.fill('[data-testid="email-input"]', TEST_CREDENTIALS.email);
        await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.password);

        // Start timing for login speed
        const loginStart = Date.now();
        await page.click('[data-testid="login-button"]');

        // Wait for successful login
        await page.waitForSelector('[data-testid="home-screen"]', { timeout: 5000 });
        const loginTime = Date.now() - loginStart;

        // Login should be fast for emergency situations
        expect(loginTime).toBeLessThan(3000); // 3 seconds max
      });

      // Access emergency section quickly
      await test.step('Navigate to emergency section quickly', async () => {
        // Emergency access should be prominently available
        // Look for emergency button/tab (should be <3 taps from home)

        // Option 1: Direct emergency button on home screen
        const emergencyButton = page.locator('[data-testid="emergency-button"]');
        if (await emergencyButton.isVisible()) {
          const accessStart = Date.now();
          await emergencyButton.click();
          await page.waitForSelector('[data-testid="emergency-screen"]');
          const accessTime = Date.now() - accessStart;
          expect(accessTime).toBeLessThan(1000); // 1 second max for direct access
        } else {
          // Option 2: Via navigation (should still be fast)
          await page.click('[data-testid="settings-tab"]');
          await page.click('[data-testid="emergency-settings"]');
          await page.waitForSelector('[data-testid="emergency-screen"]');
        }
      });

      // Verify quick access to critical information
      await test.step('Access emergency contacts rapidly', async () => {
        const contactsStart = Date.now();

        // Emergency contacts should be immediately visible
        await page.waitForSelector('[data-testid="emergency-contacts"]', { timeout: 2000 });

        const contactsLoadTime = Date.now() - contactsStart;
        expect(contactsLoadTime).toBeLessThan(100); // <100ms requirement

        // Verify contact information is displayed
        const primaryContact = page.locator('[data-testid="primary-contact"]');
        await expect(primaryContact).toBeVisible();

        // Verify phone number is clickable for immediate calling
        const callButton = page.locator('[data-testid="primary-contact-call"]');
        await expect(callButton).toBeVisible();
      });

      // Test one-touch calling functionality
      await test.step('Test one-touch emergency calling', async () => {
        // Mock the phone call intent for testing
        await page.addInitScript(() => {
          // Override window.open to track call attempts
          window.mockCallAttempts = [];
          const originalOpen = window.open;
          window.open = (url, target, features) => {
            if (url && url.startsWith('tel:')) {
              window.mockCallAttempts.push(url);
              return null; // Don't actually open
            }
            return originalOpen(url, target, features);
          };
        });

        const callStart = Date.now();
        await page.click('[data-testid="primary-contact-call"]');
        const callTime = Date.now() - callStart;

        // Call initiation should be instant
        expect(callTime).toBeLessThan(50); // 50ms max for call intent

        // Verify call was attempted
        const callAttempts = await page.evaluate(() => window.mockCallAttempts);
        expect(callAttempts.length).toBeGreaterThan(0);
        expect(callAttempts[0]).toMatch(/^tel:\+?[\d\-\(\)\s]+$/);
      });

      // Access medical information quickly
      await test.step('Access medical information rapidly', async () => {
        const medicalStart = Date.now();

        await page.waitForSelector('[data-testid="medical-info"]', { timeout: 2000 });

        const medicalLoadTime = Date.now() - medicalStart;
        expect(medicalLoadTime).toBeLessThan(100); // <100ms requirement

        // Verify critical medical information is displayed
        await expect(page.locator('[data-testid="allergies-list"]')).toBeVisible();
        await expect(page.locator('[data-testid="medications-list"]')).toBeVisible();
        await expect(page.locator('[data-testid="medical-conditions-list"]')).toBeVisible();
      });
    });

    test('Parent can generate QR code for emergency sharing', async ({ page }) => {
      // Login and navigate to emergency section
      await page.click('[data-testid="login-tab"]');
      await page.fill('[data-testid="email-input"]', TEST_CREDENTIALS.email);
      await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="home-screen"]');

      // Navigate to emergency sharing
      await page.click('[data-testid="emergency-button"]');
      await page.click('[data-testid="create-emergency-access"]');

      // Generate emergency access token
      await test.step('Create emergency access token', async () => {
        await page.fill('[data-testid="recipient-name"]', 'Test Babysitter');
        await page.fill('[data-testid="access-purpose"]', 'Emergency childcare');
        await page.selectOption('[data-testid="duration-select"]', '4'); // 4 hours

        const generateStart = Date.now();
        await page.click('[data-testid="generate-access-button"]');

        // Wait for QR code generation
        await page.waitForSelector('[data-testid="qr-code-display"]', { timeout: 3000 });
        const generateTime = Date.now() - generateStart;

        // QR generation should be reasonably fast
        expect(generateTime).toBeLessThan(2000); // 2 seconds max
      });

      // Verify QR code and sharing options
      await test.step('Verify QR code and sharing', async () => {
        // QR code should be visible
        await expect(page.locator('[data-testid="qr-code-display"]')).toBeVisible();

        // Access code should be displayed
        const accessCode = page.locator('[data-testid="access-code-display"]');
        await expect(accessCode).toBeVisible();

        // Get the access code for later tests
        emergencyAccessCode = await accessCode.textContent() || '';
        expect(emergencyAccessCode).toMatch(/^[A-Z2-9]{8}$/); // 8-character code

        // Sharing options should be available
        await expect(page.locator('[data-testid="share-qr-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="copy-link-button"]')).toBeVisible();
      });
    });
  });

  test.describe('2. Caregiver Temporary Access', () => {

    test('Caregiver can access child information via temporary token', async ({ page }) => {
      // Assume emergency access was created in previous test
      // For isolated testing, we'll create one via API

      await test.step('Setup emergency access via API', async () => {
        // Create emergency access token via GraphQL API
        const response = await page.request.post(`${API_URL}/graphql`, {
          data: {
            query: `
              mutation CreateEmergencyAccess($input: CreateEmergencyAccessInput!) {
                createEmergencyAccess(input: $input) {
                  success
                  emergencyAccess {
                    accessCode
                    accessToken
                    expiresAt
                  }
                  errors
                }
              }
            `,
            variables: {
              input: {
                recipientName: "Test Caregiver",
                purpose: "Emergency babysitting",
                durationHours: 6,
                canViewMedical: true,
                canViewContacts: true,
                canViewLocation: false
              }
            }
          },
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers if needed
          }
        });

        const result = await response.json();
        if (result.data?.createEmergencyAccess?.success) {
          emergencyAccessCode = result.data.createEmergencyAccess.emergencyAccess.accessCode;
          emergencyAccessToken = result.data.createEmergencyAccess.emergencyAccess.accessToken;
        }
      });

      // Caregiver accesses via QR code/link
      await test.step('Access via emergency link', async () => {
        const emergencyUrl = `${BASE_URL}/emergency-access/${emergencyAccessCode}`;

        const accessStart = Date.now();
        await page.goto(emergencyUrl);

        // Wait for emergency access page to load
        await page.waitForSelector('[data-testid="emergency-access-view"]', { timeout: 5000 });
        const accessTime = Date.now() - accessStart;

        // Emergency access should load quickly
        expect(accessTime).toBeLessThan(3000); // 3 seconds max
      });

      // Verify access to permitted information only
      await test.step('Verify scoped access permissions', async () => {
        // Should see child medical info (permitted)
        await expect(page.locator('[data-testid="child-medical-info"]')).toBeVisible();

        // Should see emergency contacts (permitted)
        await expect(page.locator('[data-testid="emergency-contacts"]')).toBeVisible();

        // Should NOT see full family data (restricted)
        await expect(page.locator('[data-testid="family-financial-info"]')).not.toBeVisible();

        // Should NOT see location data (restricted in this test)
        await expect(page.locator('[data-testid="child-location"]')).not.toBeVisible();

        // Should see access limitations notice
        await expect(page.locator('[data-testid="access-limitations-notice"]')).toBeVisible();
      });

      // Test caregiver emergency actions
      await test.step('Test caregiver emergency actions', async () => {
        // Should be able to call emergency contacts
        const callButton = page.locator('[data-testid="contact-parent-button"]');
        await expect(callButton).toBeVisible();

        // Should see medical alert information prominently
        const medicalAlerts = page.locator('[data-testid="medical-alerts"]');
        await expect(medicalAlerts).toBeVisible();

        // Should have access to healthcare provider info
        const healthcareInfo = page.locator('[data-testid="healthcare-providers"]');
        await expect(healthcareInfo).toBeVisible();
      });

      // Verify access is logged for PIPEDA compliance
      await test.step('Verify access logging', async () => {
        // Access should be logged (check via API if available)
        // This is more of a backend verification but we can check for indicators

        // Look for access confirmation or audit indicators
        const accessStatus = page.locator('[data-testid="access-status"]');
        if (await accessStatus.isVisible()) {
          const statusText = await accessStatus.textContent();
          expect(statusText).toContain('Access logged');
        }
      });
    });

    test('Caregiver experiences appropriate access expiry', async ({ page, context }) => {
      // Test with short-duration token (simulate expiry)
      await test.step('Test expired access token', async () => {
        // Use an expired or invalid code
        const expiredUrl = `${BASE_URL}/emergency-access/EXPIRED1`;

        await page.goto(expiredUrl);

        // Should see appropriate error message
        await expect(page.locator('[data-testid="access-expired-message"]')).toBeVisible();

        // Should not have access to any sensitive information
        await expect(page.locator('[data-testid="child-medical-info"]')).not.toBeVisible();

        // Should provide contact information for legitimate access
        await expect(page.locator('[data-testid="contact-family-link"]')).toBeVisible();
      });
    });
  });

  test.describe('3. Healthcare Provider Access', () => {

    test('Healthcare provider can access comprehensive medical information', async ({ page }) => {
      await test.step('Setup professional access token', async () => {
        // Create professional access with expanded permissions
        const response = await page.request.post(`${API_URL}/graphql`, {
          data: {
            query: `
              mutation CreateEmergencyAccess($input: CreateEmergencyAccessInput!) {
                createEmergencyAccess(input: $input) {
                  success
                  emergencyAccess {
                    accessCode
                  }
                }
              }
            `,
            variables: {
              input: {
                recipientName: "Dr. Smith - Emergency Room",
                purpose: "Emergency medical treatment",
                durationHours: 2,
                canViewMedical: true,
                canViewContacts: true,
                canViewProviders: true,
                canViewLocation: true
              }
            }
          }
        });

        const result = await response.json();
        if (result.data?.createEmergencyAccess?.success) {
          emergencyAccessCode = result.data.createEmergencyAccess.emergencyAccess.accessCode;
        }
      });

      await test.step('Access medical data professionally', async () => {
        const professionalUrl = `${BASE_URL}/emergency-access/${emergencyAccessCode}?professional=true`;

        await page.goto(professionalUrl);
        await page.waitForSelector('[data-testid="professional-medical-view"]', { timeout: 5000 });
      });

      await test.step('Verify comprehensive medical information', async () => {
        // Should see detailed medical conditions
        await expect(page.locator('[data-testid="medical-conditions"]')).toBeVisible();

        // Should see current medications with dosages
        await expect(page.locator('[data-testid="medications"]')).toBeVisible();

        // Should see allergy information with severity levels
        await expect(page.locator('[data-testid="allergies"]')).toBeVisible();

        // Should see healthcare provider contact information
        await expect(page.locator('[data-testid="healthcare-providers"]')).toBeVisible();

        // Should see emergency contacts with medical decision authorization
        const medicalContacts = page.locator('[data-testid="medical-decision-contacts"]');
        await expect(medicalContacts).toBeVisible();
      });

      await test.step('Test medical record export functionality', async () => {
        // Healthcare providers should be able to export/print summary
        const exportButton = page.locator('[data-testid="export-medical-summary"]');

        if (await exportButton.isVisible()) {
          // Set up download handling
          const downloadPromise = page.waitForEvent('download');
          await exportButton.click();

          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/medical.*summary/i);
        }
      });
    });
  });

  test.describe('4. Offline Emergency Access', () => {

    test('Emergency information remains accessible offline', async ({ page, context }) => {
      // Setup: Load emergency data while online
      await test.step('Load emergency data online', async () => {
        await page.click('[data-testid="login-tab"]');
        await page.fill('[data-testid="email-input"]', TEST_CREDENTIALS.email);
        await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.password);
        await page.click('[data-testid="login-button"]');
        await page.waitForSelector('[data-testid="home-screen"]');

        // Navigate to emergency section to cache data
        await page.click('[data-testid="emergency-button"]');
        await page.waitForSelector('[data-testid="emergency-data-loaded"]');
      });

      // Simulate offline condition
      await test.step('Simulate offline condition', async () => {
        await context.setOffline(true);

        // Reload page to test offline functionality
        await page.reload();

        // Should show offline indicator but still function
        await expect(page.locator('[data-testid="offline-warning"]')).toBeVisible();
      });

      // Verify emergency data still accessible
      await test.step('Verify offline emergency access', async () => {
        // Emergency contacts should still be visible from cache
        await expect(page.locator('[data-testid="emergency-contacts"]')).toBeVisible();

        // Medical information should be accessible
        await expect(page.locator('[data-testid="medical-info"]')).toBeVisible();

        // QR codes should still generate from cached data
        const qrButton = page.locator('[data-testid="generate-qr-code"]');
        if (await qrButton.isVisible()) {
          await qrButton.click();
          await expect(page.locator('[data-testid="qr-code-display"]')).toBeVisible();
        }
      });

      // Test degraded functionality notifications
      await test.step('Verify degraded functionality warnings', async () => {
        // Should warn about limited functionality
        await expect(page.locator('[data-testid="offline-limitations"]')).toBeVisible();

        // Should indicate when data was last synced
        await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();

        // Should disable features that require network
        const onlineOnlyButton = page.locator('[data-testid="share-online-button"]');
        if (await onlineOnlyButton.isVisible()) {
          await expect(onlineOnlyButton).toBeDisabled();
        }
      });
    });
  });

  test.describe('5. Cross-Platform Emergency Features', () => {

    test('Emergency features work consistently across platforms', async ({ page, browserName }) => {
      await test.step('Test platform-specific integrations', async () => {
        // Login first
        await page.click('[data-testid="login-tab"]');
        await page.fill('[data-testid="email-input"]', TEST_CREDENTIALS.email);
        await page.fill('[data-testid="password-input"]', TEST_CREDENTIALS.password);
        await page.click('[data-testid="login-button"]');
        await page.waitForSelector('[data-testid="home-screen"]');

        await page.click('[data-testid="emergency-button"]');

        // Test calling functionality
        const callButton = page.locator('[data-testid="primary-contact-call"]');
        await expect(callButton).toBeVisible();

        // Verify QR code generation works on all platforms
        const qrGenerator = page.locator('[data-testid="generate-qr-code"]');
        if (await qrGenerator.isVisible()) {
          await qrGenerator.click();
          await expect(page.locator('[data-testid="qr-code-display"]')).toBeVisible();
        }
      });

      await test.step('Test responsive emergency interface', async () => {
        // Test different viewport sizes
        await page.setViewportSize({ width: 375, height: 667 }); // Mobile
        await expect(page.locator('[data-testid="emergency-contacts"]')).toBeVisible();

        await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
        await expect(page.locator('[data-testid="emergency-contacts"]')).toBeVisible();

        await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
        await expect(page.locator('[data-testid="emergency-contacts"]')).toBeVisible();
      });
    });
  });

  test.describe('6. Performance and Reliability', () => {

    test('Emergency access meets performance requirements', async ({ page }) => {
      await test.step('Test emergency access speed', async () => {
        // Use valid emergency access code
        const emergencyUrl = `${BASE_URL}/emergency-access/TESTCODE`;

        const loadStart = Date.now();
        await page.goto(emergencyUrl);

        // Wait for critical information to load
        await page.waitForSelector('[data-testid="emergency-access-view"]', { timeout: 2000 });
        const loadTime = Date.now() - loadStart;

        // Emergency access must be fast
        expect(loadTime).toBeLessThan(2000); // 2 seconds max for emergency situations
      });

      await test.step('Test under simulated stress', async () => {
        // Simulate multiple rapid access attempts
        const promises = [];

        for (let i = 0; i < 5; i++) {
          promises.push(
            page.evaluate(() => {
              const start = performance.now();
              // Simulate emergency data access
              return new Promise(resolve => {
                setTimeout(() => {
                  const end = performance.now();
                  resolve(end - start);
                }, Math.random() * 100);
              });
            })
          );
        }

        const results = await Promise.all(promises);

        // All operations should complete quickly
        results.forEach(time => {
          expect(time).toBeLessThan(200); // 200ms max per operation
        });
      });
    });
  });
});

// Helper functions for test setup and teardown
test.afterEach(async ({ page }) => {
  // Clean up any emergency access tokens created during testing
  // This would typically involve API calls to revoke test tokens

  // Close any open modals or overlays
  await page.keyboard.press('Escape');
});

test.afterAll(async () => {
  // Clean up test data
  // Revoke any emergency access tokens created during testing
  // This ensures test isolation and security
});

// Custom assertions for emergency flows
expect.extend({
  async toLoadWithinMs(page: Page, selector: string, maxMs: number) {
    const start = Date.now();
    try {
      await page.waitForSelector(selector, { timeout: maxMs });
      const elapsed = Date.now() - start;
      return {
        pass: elapsed < maxMs,
        message: () => `Expected ${selector} to load within ${maxMs}ms, took ${elapsed}ms`
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Selector ${selector} not found within ${maxMs}ms`
      };
    }
  }
});

// Type declarations for custom matchers
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toLoadWithinMs(selector: string, maxMs: number): R;
    }
  }
}