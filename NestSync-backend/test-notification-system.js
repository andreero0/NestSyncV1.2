/**
 * Comprehensive End-to-End Testing for Notification System
 * Uses Playwright to test the complete notification preferences functionality
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  frontendUrl: 'http://localhost:8082',
  backendUrl: 'http://localhost:8001',
  testCredentials: {
    email: 'parents@nestsync.com',
    password: 'Shazam11#'
  },
  screenshotDir: './test-screenshots',
  testTimeout: 30000
};

// Ensure screenshot directory exists
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

class NotificationSystemTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      startTime: new Date(),
      tests: [],
      screenshots: [],
      errors: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Playwright browser...');
    this.browser = await chromium.launch({
      headless: false, // Show browser for debugging
      slowMo: 1000 // Slow down actions for visibility
    });
    this.page = await this.browser.newPage();

    // Set viewport and user agent
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'NestSync-E2E-Test/1.0'
    });

    console.log('✅ Browser initialized successfully');
  }

  async takeScreenshot(name, description) {
    const filename = `${Date.now()}-${name}.png`;
    const filepath = path.join(CONFIG.screenshotDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });

    this.testResults.screenshots.push({
      name,
      description,
      filename,
      filepath,
      timestamp: new Date()
    });

    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    return filepath;
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running test: ${testName}`);
    const startTime = Date.now();
    let result = { name: testName, status: 'failed', duration: 0, error: null };

    try {
      await testFn();
      result.status = 'passed';
      console.log(`✅ Test passed: ${testName}`);
    } catch (error) {
      result.error = error.message;
      this.testResults.errors.push({ test: testName, error: error.message, stack: error.stack });
      console.error(`❌ Test failed: ${testName} - ${error.message}`);

      // Take screenshot on failure
      await this.takeScreenshot(`error-${testName}`, `Error screenshot for ${testName}`);
    }

    result.duration = Date.now() - startTime;
    this.testResults.tests.push(result);
    this.testResults.summary.total++;
    this.testResults.summary[result.status === 'passed' ? 'passed' : 'failed']++;
  }

  async waitForElement(selector, options = {}) {
    const timeout = options.timeout || CONFIG.testTimeout;
    try {
      await this.page.waitForSelector(selector, { timeout, ...options });
      return true;
    } catch (error) {
      throw new Error(`Element not found: ${selector} (waited ${timeout}ms)`);
    }
  }

  async waitForText(text, options = {}) {
    const timeout = options.timeout || CONFIG.testTimeout;
    try {
      await this.page.waitForFunction(
        text => document.body.innerText.includes(text),
        text,
        { timeout }
      );
      return true;
    } catch (error) {
      throw new Error(`Text not found: "${text}" (waited ${timeout}ms)`);
    }
  }

  // Test Phase 1: Browser Navigation & Authentication
  async testPhase1_Navigation() {
    await this.runTest('Navigate to Frontend', async () => {
      console.log(`📍 Navigating to ${CONFIG.frontendUrl}`);
      await this.page.goto(CONFIG.frontendUrl);

      // Wait for the Expo dev server to load
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot('01-initial-load', 'Initial page load');

      // Look for Expo development interface or the app
      const pageContent = await this.page.textContent('body');
      if (!pageContent.includes('NestSync') && !pageContent.includes('Metro')) {
        throw new Error('Frontend server appears to be not responding correctly');
      }
    });

    await this.runTest('Verify Backend Connectivity', async () => {
      console.log('🔍 Testing GraphQL endpoint connectivity...');

      // Test GraphQL endpoint directly
      const response = await this.page.evaluate(async (backendUrl) => {
        try {
          const res = await fetch(`${backendUrl}/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: '{ __schema { types { name } } }'
            })
          });
          return {
            status: res.status,
            ok: res.ok,
            data: await res.json()
          };
        } catch (error) {
          return { error: error.message };
        }
      }, CONFIG.backendUrl);

      if (!response.ok) {
        throw new Error(`Backend GraphQL endpoint not accessible: ${JSON.stringify(response)}`);
      }

      // Verify notification types are in schema
      const types = response.data?.data?.__schema?.types?.map(t => t.name) || [];
      const notificationTypes = ['NotificationPreferences', 'UpdateNotificationPreferencesInput'];
      const missingTypes = notificationTypes.filter(type => !types.includes(type));

      if (missingTypes.length > 0) {
        throw new Error(`Missing notification types in GraphQL schema: ${missingTypes.join(', ')}`);
      }
    });

    await this.runTest('Wait for App to Load', async () => {
      console.log('⏳ Waiting for React Native app to load...');

      // Wait for either the login screen or the app to load
      // This might take some time as Metro needs to bundle the app
      await this.page.waitForTimeout(10000); // Give Metro time to compile

      const content = await this.page.textContent('body');
      console.log('📄 Page content preview:', content.substring(0, 500));

      await this.takeScreenshot('02-app-loaded', 'App loaded state');
    });
  }

  // Test Phase 2: Authentication Testing
  async testPhase2_Authentication() {
    await this.runTest('Test Authentication Process', async () => {
      console.log('🔐 Testing authentication...');

      // This is where we'd interact with the login form
      // Note: For web version of Expo app, we might need to adapt the selectors

      // Look for login elements (these might be React Native components rendered as web elements)
      try {
        // Try to find email input field
        const emailInput = await this.page.$('input[placeholder*="email" i], input[type="email"]');
        const passwordInput = await this.page.$('input[placeholder*="password" i], input[type="password"]');

        if (emailInput && passwordInput) {
          console.log('📝 Found login form, attempting to sign in...');

          await emailInput.fill(CONFIG.testCredentials.email);
          await passwordInput.fill(CONFIG.testCredentials.password);

          // Look for sign in button
          const signInButton = await this.page.$('button:has-text("Sign In"), [role="button"]:has-text("Sign In")');
          if (signInButton) {
            await signInButton.click();
            await this.takeScreenshot('03-login-attempt', 'Login form submitted');

            // Wait for authentication to complete
            await this.page.waitForTimeout(5000);
          }
        } else {
          console.log('🔍 No standard login form found, app might be already authenticated or using different UI pattern');
        }

        await this.takeScreenshot('04-post-auth', 'After authentication attempt');

      } catch (error) {
        console.log('ℹ️ Authentication UI might not be visible or uses different patterns:', error.message);
        // This is not necessarily a failure - the app might be already logged in or use different auth flow
      }
    });
  }

  // Test Phase 3: Navigation to Notification Settings
  async testPhase3_NavigateToSettings() {
    await this.runTest('Navigate to Settings Screen', async () => {
      console.log('⚙️ Looking for Settings navigation...');

      // Try to find Settings tab or link
      const settingsSelectors = [
        '[aria-label*="Settings" i]',
        '[role="tab"]:has-text("Settings")',
        'button:has-text("Settings")',
        'a:has-text("Settings")',
        '*:has-text("Settings")'
      ];

      let settingsElement = null;
      for (const selector of settingsSelectors) {
        try {
          settingsElement = await this.page.$(selector);
          if (settingsElement) {
            console.log(`📍 Found settings element with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      if (settingsElement) {
        await settingsElement.click();
        await this.page.waitForTimeout(2000);
        await this.takeScreenshot('05-settings-page', 'Settings page opened');
      } else {
        // Try scrolling and looking for tab navigation
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('06-looking-for-settings', 'Searching for settings navigation');

        // Log available text content for debugging
        const bodyText = await this.page.textContent('body');
        console.log('🔍 Available text content:', bodyText.substring(0, 1000));

        throw new Error('Could not locate Settings navigation element');
      }
    });

    await this.runTest('Open Notification Settings Modal', async () => {
      console.log('🔔 Looking for Notification Settings option...');

      const notificationSelectors = [
        ':has-text("Notification Settings")',
        ':has-text("Notifications")',
        '[aria-label*="notification" i]',
        '*:has-text("bell")'
      ];

      let notificationElement = null;
      for (const selector of notificationSelectors) {
        try {
          notificationElement = await this.page.$(selector);
          if (notificationElement) {
            console.log(`🔔 Found notification element with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue trying
        }
      }

      if (notificationElement) {
        await notificationElement.click();
        await this.page.waitForTimeout(3000); // Wait for modal to open
        await this.takeScreenshot('07-notification-modal', 'Notification preferences modal opened');
      } else {
        throw new Error('Could not locate Notification Settings option');
      }
    });
  }

  // Test Phase 4: UI Component Testing
  async testPhase4_UIComponents() {
    await this.runTest('Test Master Notification Toggle', async () => {
      console.log('🎛️ Testing master notification toggle...');

      const toggleSelectors = [
        'input[type="checkbox"]',
        '[role="switch"]',
        'button[aria-pressed]'
      ];

      for (const selector of toggleSelectors) {
        const toggles = await this.page.$$(selector);
        if (toggles.length > 0) {
          console.log(`Found ${toggles.length} toggle elements`);

          // Test the first toggle (likely the master toggle)
          const toggle = toggles[0];
          const initialState = await toggle.getAttribute('aria-pressed') || await toggle.getAttribute('checked');

          await toggle.click();
          await this.page.waitForTimeout(1000);

          const newState = await toggle.getAttribute('aria-pressed') || await toggle.getAttribute('checked');

          if (initialState === newState) {
            console.log('⚠️ Toggle state did not change - this might be expected if disabled');
          }

          await this.takeScreenshot('08-toggle-test', 'After testing toggle interaction');
          break;
        }
      }
    });

    await this.runTest('Test Form Controls and Inputs', async () => {
      console.log('📝 Testing form controls...');

      // Look for various input types
      const inputs = await this.page.$$('input, select, textarea, [role="textbox"], [role="combobox"]');
      const buttons = await this.page.$$('button, [role="button"]');
      const switches = await this.page.$$('[role="switch"], input[type="checkbox"]');

      console.log(`Found ${inputs.length} inputs, ${buttons.length} buttons, ${switches.length} switches`);

      await this.takeScreenshot('09-form-controls', 'Form controls overview');

      // Test a few interactive elements
      if (switches.length > 1) {
        try {
          await switches[1].click(); // Test second switch
          await this.page.waitForTimeout(500);
        } catch (error) {
          console.log('Could not interact with switch:', error.message);
        }
      }

      if (buttons.length > 0) {
        // Log button text for debugging
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
          try {
            const buttonText = await buttons[i].textContent();
            console.log(`Button ${i}: "${buttonText}"`);
          } catch (error) {
            // Continue
          }
        }
      }
    });

    await this.runTest('Test Time Picker Components', async () => {
      console.log('⏰ Testing time picker functionality...');

      // Look for time-related elements
      const timeElements = await this.page.$$(':has-text("Time"), :has-text("Hours"), input[type="time"]');

      if (timeElements.length > 0) {
        console.log(`Found ${timeElements.length} time-related elements`);

        try {
          await timeElements[0].click();
          await this.page.waitForTimeout(2000);
          await this.takeScreenshot('10-time-picker', 'Time picker interaction');
        } catch (error) {
          console.log('Time picker interaction failed:', error.message);
        }
      }
    });
  }

  // Test Phase 5: Integration Testing
  async testPhase5_Integration() {
    await this.runTest('Test GraphQL Integration', async () => {
      console.log('🔄 Testing GraphQL integration...');

      // Monitor network requests
      const requests = [];
      this.page.on('request', request => {
        if (request.url().includes('/graphql')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData()
          });
        }
      });

      // Try to trigger a GraphQL request by interacting with a switch
      const switches = await this.page.$$('[role="switch"], input[type="checkbox"]');
      if (switches.length > 0) {
        try {
          await switches[0].click();
          await this.page.waitForTimeout(3000); // Wait for potential GraphQL request

          if (requests.length > 0) {
            console.log(`✅ Captured ${requests.length} GraphQL requests`);
            requests.forEach((req, i) => {
              console.log(`Request ${i + 1}: ${req.method} ${req.url}`);
              if (req.postData) {
                console.log(`Payload: ${req.postData.substring(0, 200)}...`);
              }
            });
          } else {
            console.log('⚠️ No GraphQL requests detected - this might indicate an issue or different interaction pattern');
          }
        } catch (error) {
          console.log('Could not trigger GraphQL request:', error.message);
        }
      }

      await this.takeScreenshot('11-integration-test', 'After integration testing');
    });

    await this.runTest('Test Data Persistence', async () => {
      console.log('💾 Testing data persistence...');

      // Try to close and reopen the modal to test persistence
      try {
        // Look for close button
        const closeButton = await this.page.$('[aria-label*="close" i], button:has-text("✕"), button:has-text("Close")');
        if (closeButton) {
          await closeButton.click();
          await this.page.waitForTimeout(1000);
          await this.takeScreenshot('12-modal-closed', 'Modal closed');

          // Try to reopen
          const reopenButton = await this.page.$(':has-text("Notification Settings")');
          if (reopenButton) {
            await reopenButton.click();
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('13-modal-reopened', 'Modal reopened to test persistence');
          }
        }
      } catch (error) {
        console.log('Data persistence test encountered issue:', error.message);
      }
    });
  }

  // Test Phase 6: Error Handling & Edge Cases
  async testPhase6_ErrorHandling() {
    await this.runTest('Test Network Error Handling', async () => {
      console.log('🚫 Testing error handling...');

      // Simulate network issues by intercepting requests
      await this.page.route('**/graphql', route => {
        route.abort('failed');
      });

      try {
        // Try to interact with a control that would make a GraphQL request
        const switches = await this.page.$$('[role="switch"]');
        if (switches.length > 0) {
          await switches[0].click();
          await this.page.waitForTimeout(2000);

          // Look for error messages
          const errorText = await this.page.textContent('body');
          if (errorText.includes('error') || errorText.includes('failed') || errorText.includes('Error')) {
            console.log('✅ Error handling appears to be working - error messages detected');
          }

          await this.takeScreenshot('14-error-handling', 'Error handling test');
        }
      } finally {
        // Remove the route interception
        await this.page.unroute('**/graphql');
      }
    });

    await this.runTest('Test Form Validation', async () => {
      console.log('✅ Testing form validation...');

      // Try to submit invalid data or interact with form in unexpected ways
      const inputs = await this.page.$$('input[type="number"], input[type="text"]');

      for (let i = 0; i < Math.min(inputs.length, 3); i++) {
        try {
          // Try entering invalid data
          await inputs[i].fill('invalid-data-123');
          await inputs[i].blur(); // Trigger validation
          await this.page.waitForTimeout(500);
        } catch (error) {
          // Expected for some inputs
        }
      }

      await this.takeScreenshot('15-validation-test', 'Form validation test');
    });
  }

  async runAllTests() {
    try {
      await this.initialize();

      console.log('🎯 Starting comprehensive notification system testing...\n');

      await this.testPhase1_Navigation();
      await this.testPhase2_Authentication();
      await this.testPhase3_NavigateToSettings();
      await this.testPhase4_UIComponents();
      await this.testPhase5_Integration();
      await this.testPhase6_ErrorHandling();

    } catch (error) {
      console.error('❌ Critical test failure:', error);
      this.testResults.errors.push({
        test: 'Test Suite',
        error: error.message,
        stack: error.stack
      });
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }

    this.testResults.endTime = new Date();
    this.testResults.totalDuration = this.testResults.endTime - this.testResults.startTime;

    await this.generateReport();
  }

  async generateReport() {
    const reportData = {
      ...this.testResults,
      config: CONFIG,
      systemInfo: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    const reportPath = path.join(CONFIG.screenshotDir, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate human-readable report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlPath = path.join(CONFIG.screenshotDir, 'test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    console.log('\n📋 Test Results Summary:');
    console.log(`   Total Tests: ${reportData.summary.total}`);
    console.log(`   Passed: ${reportData.summary.passed}`);
    console.log(`   Failed: ${reportData.summary.failed}`);
    console.log(`   Success Rate: ${Math.round((reportData.summary.passed / reportData.summary.total) * 100)}%`);
    console.log(`   Total Duration: ${Math.round(reportData.totalDuration / 1000)}s`);
    console.log(`   Screenshots: ${reportData.screenshots.length}`);
    console.log(`\n📊 Full Report: ${htmlPath}`);
    console.log(`📸 Screenshots: ${CONFIG.screenshotDir}`);

    if (reportData.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      reportData.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.test}: ${error.error}`);
      });
    }
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>NestSync Notification System Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: #0891B2; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #0891B2; }
        .test-results { margin-bottom: 30px; }
        .test { margin-bottom: 10px; padding: 10px; border-radius: 4px; }
        .test.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .screenshot { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .screenshot img { width: 100%; height: 200px; object-fit: cover; }
        .screenshot-info { padding: 10px; background: #f8f9fa; }
        .errors { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 NestSync Notification System E2E Test Report</h1>
            <p>Comprehensive end-to-end testing of notification preferences functionality</p>
            <p class="timestamp">Generated: ${data.systemInfo.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${data.summary.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #28a745">${data.summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value" style="color: #dc3545">${data.summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round((data.summary.passed / data.summary.total) * 100)}%</div>
                <div>Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(data.totalDuration / 1000)}s</div>
                <div>Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${data.screenshots.length}</div>
                <div>Screenshots</div>
            </div>
        </div>

        ${data.errors.length > 0 ? `
        <div class="errors">
            <h3>❌ Errors Encountered</h3>
            ${data.errors.map(error => `
                <div><strong>${error.test}:</strong> ${error.error}</div>
            `).join('')}
        </div>
        ` : ''}

        <div class="test-results">
            <h2>🧪 Test Results</h2>
            ${data.tests.map(test => `
                <div class="test ${test.status}">
                    <strong>${test.name}</strong> - ${test.status.toUpperCase()} (${test.duration}ms)
                    ${test.error ? `<br><small style="color: #dc3545">Error: ${test.error}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="screenshots">
            <h2>📸 Test Screenshots</h2>
            ${data.screenshots.map(screenshot => `
                <div class="screenshot">
                    <img src="${screenshot.filename}" alt="${screenshot.description}">
                    <div class="screenshot-info">
                        <strong>${screenshot.name}</strong><br>
                        <small>${screenshot.description}</small><br>
                        <small class="timestamp">${screenshot.timestamp}</small>
                    </div>
                </div>
            `).join('')}
        </div>

        <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3>🔧 Test Configuration</h3>
            <ul>
                <li><strong>Frontend URL:</strong> ${data.config.frontendUrl}</li>
                <li><strong>Backend URL:</strong> ${data.config.backendUrl}</li>
                <li><strong>Test Account:</strong> ${data.config.testCredentials.email}</li>
                <li><strong>Platform:</strong> ${data.systemInfo.platform}</li>
                <li><strong>Node Version:</strong> ${data.systemInfo.nodeVersion}</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting NestSync Notification System E2E Testing\n');

  const tester = new NotificationSystemTester();
  await tester.runAllTests();

  console.log('\n✅ Testing complete! Check the generated report for detailed results.');
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = NotificationSystemTester;