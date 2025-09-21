import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for NestSync Reorder Flow Testing
 * Comprehensive cross-platform testing with Canadian compliance focus
 */

export default defineConfig({
  // Test directory
  testDir: './reorder-flow',

  // Global test timeout (10 minutes for complex integration tests)
  timeout: 10 * 60 * 1000,

  // Expect timeout for individual assertions
  expect: {
    timeout: 30 * 1000,
  },

  // Test execution configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  // Test reporting
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
  ],

  // Global test settings
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8082',

    // Canadian locale settings
    locale: 'en-CA',
    timezoneId: 'America/Toronto',

    // Browser settings
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },

    // Network settings
    ignoreHTTPSErrors: true,

    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Action timeouts
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,

    // Extra HTTP headers for Canadian compliance testing
    extraHTTPHeaders: {
      'Accept-Language': 'en-CA,en;q=0.9',
      'X-Test-Mode': 'true',
      'X-Compliance-Region': 'CA',
    },
  },

  // Project configurations for different platforms and browsers
  projects: [
    // Setup project for authentication and test data
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },

    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.cleanup\.ts/,
    },

    // Desktop browsers with Canadian locale
    {
      name: 'canadian-chrome',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
        extraHTTPHeaders: {
          'Accept-Language': 'en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7',
          'X-Test-Region': 'CA',
        },
      },
      dependencies: ['setup'],
    },

    {
      name: 'canadian-firefox',
      use: {
        ...devices['Desktop Firefox'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
        extraHTTPHeaders: {
          'Accept-Language': 'en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7',
          'X-Test-Region': 'CA',
        },
      },
      dependencies: ['setup'],
    },

    {
      name: 'canadian-safari',
      use: {
        ...devices['Desktop Safari'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
      },
      dependencies: ['setup'],
    },

    // Mobile devices with Canadian settings
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 12'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
      },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 5'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
      },
      dependencies: ['setup'],
    },

    // Tablet testing
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad Pro'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
      },
      dependencies: ['setup'],
    },

    // Performance testing configuration
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
        // Throttle network for realistic conditions
        launchOptions: {
          args: ['--disable-web-security', '--disable-background-timer-throttling'],
        },
      },
      testMatch: /.*\.performance\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
        // High contrast mode for accessibility testing
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      },
      testMatch: /.*\.accessibility\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Cross-browser compatibility testing
    {
      name: 'cross-browser',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
      },
      testMatch: /.*\.cross-platform\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Security testing configuration
    {
      name: 'security',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
        extraHTTPHeaders: {
          'X-Security-Test': 'true',
          'X-PIPEDA-Compliance': 'validate',
        },
      },
      testMatch: /.*\.security\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],

  // Web server configuration for local development
  webServer: process.env.CI ? undefined : [
    {
      command: 'npm run start:test-env',
      url: 'http://localhost:8082',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        REACT_APP_API_URL: 'http://localhost:8001',
        REACT_APP_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_TEST_KEY,
        REACT_APP_TEST_MODE: 'true',
      },
    },
    {
      command: 'cd ../NestSync-backend && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload',
      url: 'http://localhost:8001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        ENVIRONMENT: 'test',
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        STRIPE_SECRET_KEY: process.env.STRIPE_TEST_SECRET_KEY,
        RATE_LIMITING_ENABLED: 'false',
      },
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
});

// Environment-specific configuration
export const environments = {
  development: {
    baseURL: 'http://localhost:8082',
    apiURL: 'http://localhost:8001',
  },
  staging: {
    baseURL: 'https://nestsync-staging.vercel.app',
    apiURL: 'https://nestsync-api-staging.railway.app',
  },
  production: {
    baseURL: 'https://nestsync.ca',
    apiURL: 'https://nestsync-api.railway.app',
  },
};

// Canadian test data configuration
export const canadianTestConfig = {
  provinces: [
    { code: 'ON', name: 'Ontario', gst: 0.05, pst: 0.08 },
    { code: 'BC', name: 'British Columbia', gst: 0.05, pst: 0.07 },
    { code: 'QC', name: 'Quebec', gst: 0.05, qst: 0.09975 },
    { code: 'AB', name: 'Alberta', gst: 0.05, pst: 0.00 },
    { code: 'SK', name: 'Saskatchewan', gst: 0.05, pst: 0.06 },
    { code: 'MB', name: 'Manitoba', gst: 0.05, pst: 0.07 },
    { code: 'NB', name: 'New Brunswick', hst: 0.15 },
    { code: 'NS', name: 'Nova Scotia', hst: 0.15 },
    { code: 'PE', name: 'Prince Edward Island', hst: 0.15 },
    { code: 'NL', name: 'Newfoundland and Labrador', hst: 0.15 },
    { code: 'YT', name: 'Yukon', gst: 0.05, pst: 0.00 },
    { code: 'NT', name: 'Northwest Territories', gst: 0.05, pst: 0.00 },
    { code: 'NU', name: 'Nunavut', gst: 0.05, pst: 0.00 },
  ],

  testAddresses: {
    toronto: {
      street: '123 Queen Street West',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2M9',
      country: 'CA',
    },
    vancouver: {
      street: '456 Granville Street',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6C 1V5',
      country: 'CA',
    },
    montreal: {
      street: '789 Rue Sainte-Catherine',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H3B 1A7',
      country: 'CA',
    },
  },

  stripeTestCards: {
    visa: '4242424242424242',
    visaDebit: '4000056655665556',
    mastercard: '5555555555554444',
    amex: '378282246310005',
    declined: '4000000000000002',
    requiresAuthentication: '4000002500003155',
  },
};

// Performance thresholds
export const performanceThresholds = {
  mlPrediction: 2000, // ms
  graphqlQuery: 500, // ms
  subscriptionConnection: 1000, // ms
  realTimeUpdate: 100, // ms
  componentRender: 16, // ms (60fps)
  storageAccess: 100, // ms
  premiumActivation: 2000, // ms
};

// Accessibility requirements
export const accessibilityConfig = {
  contrastRatio: 7.0, // WCAG AAA
  touchTargetSize: 44, // px minimum
  emergencyTouchTarget: 56, // px for critical actions
  minimumFontSize: 16, // px
  criticalInfoFontSize: 20, // px
};