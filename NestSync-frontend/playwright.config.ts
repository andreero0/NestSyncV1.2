import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Emergency Flows testing
 * Optimized for emergency scenarios with fast execution and reliability
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for emergency flow dependencies

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/emergency-flows-results.json' }],
    ['junit', { outputFile: 'test-results/emergency-flows-junit.xml' }]
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.NODE_ENV === 'production'
      ? 'https://nestsync.ca'
      : 'http://localhost:8082',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot settings for emergency flow debugging */
    screenshot: 'only-on-failure',

    /* Video recording for critical failures */
    video: 'retain-on-failure',

    /* Global timeout for emergency scenarios */
    actionTimeout: 10000, // 10 seconds max for emergency actions
    navigationTimeout: 15000, // 15 seconds max for page loads

    /* Emergency scenarios require fast, reliable connections */
    launchOptions: {
      slowMo: 0, // No artificial delays for emergency testing
    },

    /* Context options for emergency testing */
    contextOptions: {
      // Simulate mobile emergency usage
      permissions: ['geolocation', 'notifications'],
      geolocation: { latitude: 43.6532, longitude: -79.3832 }, // Toronto, ON
      locale: 'en-CA',
      timezoneId: 'America/Toronto',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'emergency-chrome-mobile',
      use: {
        ...devices['Pixel 5'],
        // Mobile emergency scenarios are most critical
        contextOptions: {
          permissions: ['geolocation', 'notifications'],
          geolocation: { latitude: 43.6532, longitude: -79.3832 },
        }
      },
    },

    {
      name: 'emergency-safari-mobile',
      use: {
        ...devices['iPhone 12'],
        // iOS emergency integration testing
        contextOptions: {
          permissions: ['geolocation', 'notifications'],
        }
      },
    },

    {
      name: 'emergency-desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Web emergency access testing
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'emergency-tablet',
      use: {
        ...devices['iPad Pro'],
        // Tablet emergency scenarios
      },
    },

    /* Test against branded browsers. */
    {
      name: 'emergency-edge',
      use: { ...devices['Desktop Edge'] },
    },

    /* Test offline scenarios */
    {
      name: 'emergency-offline',
      use: {
        ...devices['Pixel 5'],
        // Will be set to offline during specific tests
        contextOptions: {
          offline: false, // Controlled per test
        }
      },
    },
  ],

  /* Folder for test artifacts */
  outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : [
    {
      command: 'npm run start',
      url: 'http://localhost:8082',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes to start
    },
    {
      command: 'cd ../NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload',
      url: 'http://localhost:8001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000, // 1 minute to start backend
    }
  ],

  /* Global test timeout for emergency scenarios */
  timeout: 30 * 1000, // 30 seconds max per test (emergency priority)

  /* Expect timeout for emergency assertions */
  expect: {
    timeout: 5 * 1000, // 5 seconds max for emergency assertions
  },

  /* Test match patterns */
  testMatch: [
    '**/tests/**/*emergency*.spec.ts',
    '**/tests/**/*emergency*.test.ts',
    '**/tests/**/*e2e*.spec.ts'
  ],

  /* Ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.expo/**'
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});