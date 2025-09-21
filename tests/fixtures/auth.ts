import { test as base, expect } from '@playwright/test';
import { Page, BrowserContext } from '@playwright/test';

/**
 * Authentication Fixtures for NestSync Testing
 * Handles user authentication, session management, and Canadian compliance
 */

export interface AuthUser {
  email: string;
  password: string;
  subscription?: 'basic' | 'premium' | 'family';
  province?: string;
  children?: Array<{
    name: string;
    birthDate: string;
    diaperSize: string;
  }>;
}

export interface AuthenticatedPage {
  page: Page;
  user: AuthUser;
  authToken?: string;
  sessionId?: string;
}

// Test users for different scenarios
export const TEST_USERS: Record<string, AuthUser> = {
  // Primary test user (existing account)
  primary: {
    email: 'parents@nestsync.com',
    password: 'Shazam11#',
    subscription: 'basic',
    province: 'ON',
    children: [
      {
        name: 'Emma',
        birthDate: '2023-06-15',
        diaperSize: '4',
      },
    ],
  },

  // Premium user for subscription testing
  premium: {
    email: 'premium@nestsync-test.com',
    password: 'Test123!@#',
    subscription: 'premium',
    province: 'BC',
    children: [
      {
        name: 'Liam',
        birthDate: '2023-03-20',
        diaperSize: '3',
      },
    ],
  },

  // Family plan user for multi-child testing
  family: {
    email: 'family@nestsync-test.com',
    password: 'Test123!@#',
    subscription: 'family',
    province: 'QC',
    children: [
      {
        name: 'Sophie',
        birthDate: '2023-01-10',
        diaperSize: '5',
      },
      {
        name: 'Oliver',
        birthDate: '2024-08-05',
        diaperSize: '2',
      },
    ],
  },

  // New user for registration testing
  newUser: {
    email: 'newuser@nestsync-test.com',
    password: 'Test123!@#',
    province: 'AB',
  },
};

// Canadian provinces for compliance testing
export const CANADIAN_PROVINCES = [
  { code: 'ON', name: 'Ontario', gst: 0.05, pst: 0.08 },
  { code: 'BC', name: 'British Columbia', gst: 0.05, pst: 0.07 },
  { code: 'QC', name: 'Quebec', gst: 0.05, qst: 0.09975 },
  { code: 'AB', name: 'Alberta', gst: 0.05, pst: 0.00 },
];

/**
 * Authentication helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.navigateToLogin();

    // Fill login form
    await this.page.getByTestId('email-input').fill(email);
    await this.page.getByTestId('password-input').fill(password);

    // Submit form
    await this.page.getByTestId('login-button').click();

    // Wait for successful login
    await this.page.waitForURL('/dashboard', { timeout: 30000 });
    await this.page.waitForLoadState('networkidle');

    // Verify authentication success
    await expect(this.page.getByTestId('user-menu')).toBeVisible();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Open user menu
    await this.page.getByTestId('user-menu').click();

    // Click logout
    await this.page.getByTestId('logout-button').click();

    // Wait for redirect to login
    await this.page.waitForURL('/login', { timeout: 15000 });

    // Verify logout success
    await expect(this.page.getByTestId('login-form')).toBeVisible();
  }

  /**
   * Check authentication status
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.page.getByTestId('user-menu').waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user's subscription status
   */
  async getSubscriptionStatus(): Promise<string | null> {
    if (!(await this.isAuthenticated())) {
      return null;
    }

    try {
      // Navigate to settings to check subscription
      await this.page.goto('/settings/subscription');
      await this.page.waitForLoadState('networkidle');

      const subscriptionElement = await this.page.getByTestId('subscription-tier');
      return await subscriptionElement.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Verify PIPEDA compliance elements are present
   */
  async verifyPIPEDACompliance(): Promise<void> {
    // Check for Canadian data residency notice
    await expect(this.page.getByText('🇨🇦 Data stored in Canada')).toBeVisible();

    // Check for consent management
    await this.page.goto('/settings/privacy');
    await expect(this.page.getByTestId('data-consent-controls')).toBeVisible();
    await expect(this.page.getByTestId('data-retention-info')).toBeVisible();
  }

  /**
   * Create a new test user account
   */
  async registerNewUser(user: AuthUser): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');

    // Fill registration form
    await this.page.getByTestId('email-input').fill(user.email);
    await this.page.getByTestId('password-input').fill(user.password);
    await this.page.getByTestId('confirm-password-input').fill(user.password);

    // Select province for Canadian compliance
    if (user.province) {
      await this.page.getByTestId('province-select').selectOption(user.province);
    }

    // Accept terms and privacy policy (PIPEDA compliance)
    await this.page.getByTestId('terms-checkbox').check();
    await this.page.getByTestId('privacy-checkbox').check();

    // Submit registration
    await this.page.getByTestId('register-button').click();

    // Wait for email verification notice or direct login
    try {
      // Check if email verification is required
      await this.page.waitForSelector('[data-testid="email-verification-notice"]', { timeout: 5000 });
      console.log('Email verification required for new user');
    } catch {
      // Direct login - wait for dashboard
      await this.page.waitForURL('/onboarding', { timeout: 30000 });
      console.log('User registered and logged in successfully');
    }
  }

  /**
   * Complete onboarding flow for new users
   */
  async completeOnboarding(children: AuthUser['children'] = []): Promise<void> {
    await this.page.waitForURL('/onboarding');

    // Welcome step
    await this.page.getByTestId('onboarding-start-button').click();

    // Add children
    for (const child of children) {
      await this.page.getByTestId('add-child-button').click();
      await this.page.getByTestId('child-name-input').fill(child.name);
      await this.page.getByTestId('birth-date-input').fill(child.birthDate);
      await this.page.getByTestId('diaper-size-select').selectOption(child.diaperSize);
      await this.page.getByTestId('save-child-button').click();
    }

    // Continue to next step
    await this.page.getByTestId('onboarding-continue-button').click();

    // Complete onboarding
    await this.page.getByTestId('onboarding-finish-button').click();

    // Wait for dashboard
    await this.page.waitForURL('/dashboard', { timeout: 30000 });
  }

  /**
   * Set up premium subscription for testing
   */
  async setupPremiumSubscription(
    tier: 'basic' | 'premium' | 'family' = 'premium'
  ): Promise<void> {
    await this.page.goto('/settings/subscription');
    await this.page.waitForLoadState('networkidle');

    // Click upgrade button
    await this.page.getByTestId(`upgrade-to-${tier}`).click();

    // Fill payment information with test card
    await this.page.getByTestId('card-number').fill('4242424242424242');
    await this.page.getByTestId('card-expiry').fill('12/28');
    await this.page.getByTestId('card-cvc').fill('123');
    await this.page.getByTestId('card-postal').fill('M5H 2M9');

    // Confirm subscription
    await this.page.getByTestId('confirm-subscription').click();

    // Wait for success confirmation
    await expect(this.page.getByTestId('subscription-success')).toBeVisible();

    // Verify subscription is active
    await expect(this.page.getByTestId('subscription-tier')).toContainText(tier);
  }
}

/**
 * Extend Playwright test with authentication fixtures
 */
export const test = base.extend<{
  authenticatedPage: AuthenticatedPage;
  authHelper: AuthHelper;
  primaryUser: AuthenticatedPage;
  premiumUser: AuthenticatedPage;
  familyUser: AuthenticatedPage;
}>({
  // Auth helper fixture
  authHelper: async ({ page }, use) => {
    const helper = new AuthHelper(page);
    await use(helper);
  },

  // Generic authenticated page
  authenticatedPage: async ({ page, authHelper }, use) => {
    const user = TEST_USERS.primary;
    await authHelper.login(user.email, user.password);

    await use({
      page,
      user,
      authToken: await page.evaluate(() => localStorage.getItem('authToken')),
      sessionId: await page.evaluate(() => localStorage.getItem('sessionId')),
    });

    // Cleanup: logout after test
    try {
      await authHelper.logout();
    } catch (error) {
      console.log('Logout cleanup failed:', error);
    }
  },

  // Primary user fixture
  primaryUser: async ({ page, authHelper }, use) => {
    const user = TEST_USERS.primary;
    await authHelper.login(user.email, user.password);

    await use({
      page,
      user,
    });

    try {
      await authHelper.logout();
    } catch (error) {
      console.log('Primary user logout cleanup failed:', error);
    }
  },

  // Premium user fixture
  premiumUser: async ({ page, authHelper }, use) => {
    const user = TEST_USERS.premium;

    // Create user if doesn't exist, then login
    try {
      await authHelper.login(user.email, user.password);
    } catch {
      await authHelper.registerNewUser(user);
      await authHelper.completeOnboarding(user.children);
      await authHelper.setupPremiumSubscription('premium');
    }

    await use({
      page,
      user,
    });

    try {
      await authHelper.logout();
    } catch (error) {
      console.log('Premium user logout cleanup failed:', error);
    }
  },

  // Family user fixture
  familyUser: async ({ page, authHelper }, use) => {
    const user = TEST_USERS.family;

    // Create user if doesn't exist, then login
    try {
      await authHelper.login(user.email, user.password);
    } catch {
      await authHelper.registerNewUser(user);
      await authHelper.completeOnboarding(user.children);
      await authHelper.setupPremiumSubscription('family');
    }

    await use({
      page,
      user,
    });

    try {
      await authHelper.logout();
    } catch (error) {
      console.log('Family user logout cleanup failed:', error);
    }
  },
});

export { expect } from '@playwright/test';