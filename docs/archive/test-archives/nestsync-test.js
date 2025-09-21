const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:8083',
  credentials: {
    email: 'parents@nestsync.com',
    password: 'Shazam11#'
  },
  screenshotDir: './test-screenshots',
  timeout: 30000
};

// Ensure screenshots directory exists
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

async function runNestSyncTests() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down for debugging
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture console messages and errors
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('Page error:', error);
  });

  page.on('requestfailed', request => {
    errors.push({
      type: 'Network Error',
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
    console.error('Network request failed:', request.url(), request.failure());
  });

  const testResults = {
    success: [],
    failures: [],
    errors: errors,
    consoleMessages: consoleMessages,
    screenshots: []
  };

  try {
    console.log('🧪 Starting NestSync Application Test Suite');
    console.log('==========================================');

    // Test 1: Navigate to application
    console.log('📍 Test 1: Navigating to NestSync application...');
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });

    // Take initial screenshot
    const initialScreenshot = `${TEST_CONFIG.screenshotDir}/01-initial-load.png`;
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    testResults.screenshots.push({ step: 'Initial Load', path: initialScreenshot });
    console.log('✅ Successfully navigated to application');
    console.log(`📸 Screenshot saved: ${initialScreenshot}`);
    testResults.success.push('Application loaded successfully');

    // Wait for page to fully load and check for React app
    await page.waitForTimeout(3000);

    // Test 2: Check if the page is a React app
    console.log('📍 Test 2: Verifying React application is running...');
    const reactCheck = await page.evaluate(() => {
      return window.React !== undefined ||
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('div[id="root"]') !== null ||
             document.querySelector('div[id="__next"]') !== null;
    });

    if (reactCheck) {
      console.log('✅ React application detected');
      testResults.success.push('React application is running');
    } else {
      console.log('⚠️  React application not clearly detected, but proceeding...');
      testResults.failures.push('React application detection unclear');
    }

    // Test 3: Look for authentication elements
    console.log('📍 Test 3: Looking for authentication elements...');

    // Look for common authentication UI elements
    const authElements = await page.evaluate(() => {
      const selectors = [
        'input[type="email"]',
        'input[type="password"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="password" i]',
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'button:has-text("Log in")',
        '[data-testid*="login"]',
        '[data-testid*="signin"]'
      ];

      const found = [];
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            found.push({
              selector,
              count: elements.length,
              visible: Array.from(elements).some(el => el.offsetParent !== null)
            });
          }
        } catch (e) {
          // Ignore selector errors
        }
      });

      return found;
    });

    const authScreenshot = `${TEST_CONFIG.screenshotDir}/02-auth-elements.png`;
    await page.screenshot({ path: authScreenshot, fullPage: true });
    testResults.screenshots.push({ step: 'Auth Elements Check', path: authScreenshot });

    console.log('🔍 Authentication elements found:', authElements);

    if (authElements.length > 0) {
      console.log('✅ Authentication elements detected');
      testResults.success.push('Authentication UI elements found');

      // Test 4: Attempt login
      console.log('📍 Test 4: Attempting login with test credentials...');

      try {
        // Try to find email input
        const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i]').first();
        const passwordInput = await page.locator('input[type="password"], input[placeholder*="password" i]').first();
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")').first();

        if (await emailInput.isVisible()) {
          await emailInput.fill(TEST_CONFIG.credentials.email);
          console.log('✅ Email filled');
        }

        if (await passwordInput.isVisible()) {
          await passwordInput.fill(TEST_CONFIG.credentials.password);
          console.log('✅ Password filled');
        }

        const beforeLoginScreenshot = `${TEST_CONFIG.screenshotDir}/03-before-login.png`;
        await page.screenshot({ path: beforeLoginScreenshot, fullPage: true });
        testResults.screenshots.push({ step: 'Before Login', path: beforeLoginScreenshot });

        if (await submitButton.isVisible()) {
          await submitButton.click();
          console.log('✅ Login button clicked');

          // Wait for navigation or error
          await page.waitForTimeout(5000);

          const afterLoginScreenshot = `${TEST_CONFIG.screenshotDir}/04-after-login.png`;
          await page.screenshot({ path: afterLoginScreenshot, fullPage: true });
          testResults.screenshots.push({ step: 'After Login', path: afterLoginScreenshot });

          // Check if login was successful
          const currentUrl = page.url();
          console.log('🌐 Current URL after login:', currentUrl);

          // Look for post-login elements
          const postLoginElements = await page.evaluate(() => {
            const indicators = [
              // Look for user-specific content
              'Emma', // Specific child name mentioned
              'logout',
              'sign out',
              'dashboard',
              'profile',
              'settings',
              // Look for navigation or tabs
              'nav', 'navigation',
              '[role="navigation"]',
              '.tab', '[data-testid*="tab"]'
            ];

            const found = [];
            indicators.forEach(indicator => {
              const elements = document.querySelectorAll(`*:contains("${indicator}"), [class*="${indicator}"], [data-testid*="${indicator}"]`);
              if (elements.length > 0) {
                found.push(indicator);
              }
            });

            // Also check page content
            const bodyText = document.body.innerText.toLowerCase();
            indicators.forEach(indicator => {
              if (bodyText.includes(indicator.toLowerCase())) {
                found.push(`text:${indicator}`);
              }
            });

            return found;
          });

          console.log('🔍 Post-login indicators found:', postLoginElements);

          if (postLoginElements.length > 0) {
            console.log('✅ Login appears successful - found post-login content');
            testResults.success.push('Login successful - post-login content detected');

            // Test 5: Look for child data (Emma)
            console.log('📍 Test 5: Looking for child data (Emma record)...');

            const childDataFound = await page.evaluate(() => {
              const bodyText = document.body.innerText;
              return {
                hasEmma: bodyText.includes('Emma'),
                hasChildData: bodyText.toLowerCase().includes('child') ||
                             bodyText.toLowerCase().includes('baby') ||
                             bodyText.toLowerCase().includes('diaper'),
                pageContent: bodyText.substring(0, 500) // First 500 chars for analysis
              };
            });

            console.log('👶 Child data check:', childDataFound);

            if (childDataFound.hasEmma) {
              console.log('✅ Emma record found');
              testResults.success.push('Emma child record found');
            } else {
              console.log('❌ Emma record not found');
              testResults.failures.push('Emma child record not found');
            }

            // Test 6: Look for collaboration features
            console.log('📍 Test 6: Looking for collaboration features...');

            const collaborationFeatures = await page.evaluate(() => {
              const bodyText = document.body.innerText.toLowerCase();
              const collaborationKeywords = [
                'collaboration', 'collaborate', 'family', 'caregiver',
                'share', 'invite', 'permission', 'access'
              ];

              const found = [];
              collaborationKeywords.forEach(keyword => {
                if (bodyText.includes(keyword)) {
                  found.push(keyword);
                }
              });

              // Look for UI elements that might indicate collaboration
              const collaborationElements = document.querySelectorAll(
                '[class*="collaborat"], [data-testid*="collaborat"], [class*="family"], [data-testid*="family"]'
              );

              return {
                keywords: found,
                elements: collaborationElements.length,
                hasCollaboration: found.length > 0 || collaborationElements.length > 0
              };
            });

            console.log('🤝 Collaboration features check:', collaborationFeatures);

            if (collaborationFeatures.hasCollaboration) {
              console.log('✅ Collaboration features detected');
              testResults.success.push('Collaboration features detected');
            } else {
              console.log('❌ Collaboration features not clearly visible');
              testResults.failures.push('Collaboration features not clearly visible');
            }

            // Test 7: Look for family management
            console.log('📍 Test 7: Looking for family management functionality...');

            const familyManagement = await page.evaluate(() => {
              const bodyText = document.body.innerText.toLowerCase();
              const familyKeywords = [
                'family', 'member', 'household', 'parent', 'guardian',
                'manage', 'settings', 'profile', 'account'
              ];

              const found = [];
              familyKeywords.forEach(keyword => {
                if (bodyText.includes(keyword)) {
                  found.push(keyword);
                }
              });

              return {
                keywords: found,
                hasFamilyManagement: found.length >= 2 // Need at least 2 family-related terms
              };
            });

            console.log('👨‍👩‍👧‍👦 Family management check:', familyManagement);

            if (familyManagement.hasFamilyManagement) {
              console.log('✅ Family management features detected');
              testResults.success.push('Family management features detected');
            } else {
              console.log('❌ Family management features not clearly visible');
              testResults.failures.push('Family management features not clearly visible');
            }

          } else {
            console.log('❌ Login may have failed - no post-login content detected');
            testResults.failures.push('Login failed - no post-login content detected');
          }

        } else {
          console.log('❌ Submit button not found');
          testResults.failures.push('Submit button not found');
        }

      } catch (loginError) {
        console.error('❌ Login attempt failed:', loginError);
        testResults.failures.push(`Login attempt failed: ${loginError.message}`);
      }

    } else {
      console.log('❌ No authentication elements found');
      testResults.failures.push('No authentication elements found');
    }

    // Final screenshot
    const finalScreenshot = `${TEST_CONFIG.screenshotDir}/05-final-state.png`;
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    testResults.screenshots.push({ step: 'Final State', path: finalScreenshot });

  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.failures.push(`Test execution error: ${error.message}`);

    // Emergency screenshot
    try {
      const errorScreenshot = `${TEST_CONFIG.screenshotDir}/error-state.png`;
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      testResults.screenshots.push({ step: 'Error State', path: errorScreenshot });
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }
  }

  await browser.close();

  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      totalTests: testResults.success.length + testResults.failures.length,
      passed: testResults.success.length,
      failed: testResults.failures.length,
      errors: testResults.errors.length,
      screenshots: testResults.screenshots.length
    }
  };

  const reportPath = './nestsync-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n🎯 TEST EXECUTION COMPLETE');
  console.log('===========================');
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`🚨 Errors: ${report.summary.errors}`);
  console.log(`📸 Screenshots: ${report.summary.screenshots}`);
  console.log(`📄 Report saved: ${reportPath}`);
  console.log(`📁 Screenshots: ${TEST_CONFIG.screenshotDir}`);

  return report;
}

// Run the tests
runNestSyncTests().catch(console.error);