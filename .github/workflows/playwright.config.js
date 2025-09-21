// Playwright Configuration for NestSync Critical Path Testing
// Optimized for GitHub Actions CI/CD environment
// Prevents authentication and GraphQL schema failures

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory and patterns
  testDir: './',
  testMatch: ['**/*-test.spec.js', '**/*-smoke-test.spec.js'],

  // Timeout configurations
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  // Test execution configuration
  fullyParallel: false, // Sequential execution for critical path tests
  forbidOnly: !!process.env.CI, // Fail if test.only in CI
  retries: process.env.CI ? 2 : 1, // Retry failed tests in CI
  workers: process.env.CI ? 1 : 1, // Single worker for critical path

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'] // Console output
  ],

  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8082',

    // Browser configuration
    headless: true,
    viewport: { width: 1280, height: 720 },

    // Network and timing
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Screenshots and videos for debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Additional context options
    ignoreHTTPSErrors: true, // For development environments
    acceptDownloads: false,

    // User agent for consistency
    userAgent: 'NestSync-CI-Testing'
  },

  // Test projects for different scenarios
  projects: [
    {
      name: 'authentication-critical-path',
      testMatch: ['**/auth-smoke-test.spec.js'],
      use: {
        ...devices['Desktop Chrome'],
        // Authentication-specific settings
        storageState: undefined, // Fresh state for each auth test
      },
      // Run authentication tests first
      dependencies: [],
    },

    {
      name: 'cross-platform-validation',
      testMatch: ['**/cross-platform-test.spec.js'],
      use: {
        ...devices['Desktop Safari'],
        // Test cross-platform compatibility
      },
      dependencies: ['authentication-critical-path'],
    },

    {
      name: 'mobile-compatibility',
      testMatch: ['**/mobile-compat-test.spec.js'],
      use: {
        ...devices['iPhone 12'],
        // Mobile-specific testing
      },
      dependencies: ['authentication-critical-path'],
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./test-setup.js'),
  globalTeardown: require.resolve('./test-teardown.js'),

  // Note: Web servers are started by Docker in CI environment
  // For local testing, ensure Docker containers are running:
  // cd docker && docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

  // Output directories
  outputDir: 'test-results/artifacts',

  // Metadata for reports
  metadata: {
    testSuite: 'NestSync Critical Path Integration Tests',
    environment: process.env.NODE_ENV || 'test',
    version: process.env.NESTSYNC_VERSION || 'development',
    ciProvider: process.env.CI ? 'GitHub Actions' : 'Local',
    timestamp: new Date().toISOString()
  }
});