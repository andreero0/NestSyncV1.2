/**
 * NestSync Application Verification Test
 * Comprehensive end-to-end testing to verify current application state
 * Following the 30-thought analysis of Zustand v5 infinite loop issues
 */

const { chromium } = require('playwright');

async function verifyNestSyncApplication() {
  console.log('🔍 Starting NestSync Application Verification...');
  console.log('📊 Target: http://localhost:8082');
  console.log('👤 Credentials: parents@nestsync.com / Shazam11#');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down for observation
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages for infinite loop detection
  const consoleMessages = [];
  page.on('console', msg => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);

    // Check for critical errors
    if (message.includes('Maximum update depth exceeded') ||
        message.includes('infinite loop') ||
        message.includes('too many re-renders')) {
      console.log('🚨 CRITICAL ERROR DETECTED:', message);
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });

  try {
    console.log('📝 Step 1: Navigating to application...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });

    // Take initial screenshot
    await page.screenshot({ path: 'verification-01-initial.png' });
    console.log('📸 Screenshot: verification-01-initial.png');

    console.log('📝 Step 2: Waiting for application to load...');
    await page.waitForTimeout(3000);

    // Check if login form is present
    console.log('📝 Step 3: Looking for authentication elements...');

    let authElements = 0;
    try {
      await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 5000 });
      authElements++;
      console.log('✅ Email input found');
    } catch (e) {
      console.log('⚠️  Email input not immediately visible');
    }

    try {
      await page.waitForSelector('input[type="password"], input[placeholder*="password" i]', { timeout: 5000 });
      authElements++;
      console.log('✅ Password input found');
    } catch (e) {
      console.log('⚠️  Password input not immediately visible');
    }

    if (authElements > 0) {
      console.log('📝 Step 4: Attempting authentication...');

      // Fill in credentials
      await page.fill('input[type="email"], input[placeholder*="email" i]', 'parents@nestsync.com');
      await page.fill('input[type="password"], input[placeholder*="password" i]', 'Shazam11#');

      await page.screenshot({ path: 'verification-02-credentials-filled.png' });
      console.log('📸 Screenshot: verification-02-credentials-filled.png');

      // Submit login
      await page.click('button[type="submit"], button:has-text("sign in"), button:has-text("login")');
      console.log('🔐 Login submitted, waiting for response...');

      // Wait for navigation or error
      await page.waitForTimeout(5000);

      await page.screenshot({ path: 'verification-03-post-login.png' });
      console.log('📸 Screenshot: verification-03-post-login.png');

      // Check for infinite loop errors in console
      const criticalErrors = consoleMessages.filter(msg =>
        msg.includes('Maximum update depth exceeded') ||
        msg.includes('infinite loop') ||
        msg.includes('too many re-renders')
      );

      if (criticalErrors.length > 0) {
        console.log('🚨 CRITICAL ERRORS DETECTED:');
        criticalErrors.forEach(error => console.log(`   - ${error}`));
        return {
          status: 'FAILED',
          reason: 'Infinite loop errors detected',
          errors: criticalErrors
        };
      }

      console.log('📝 Step 5: Testing navigation and tab functionality...');

      // Look for main app elements
      const appElements = await page.locator('button, a, div[role="button"]').count();
      console.log(`🔍 Found ${appElements} interactive elements`);

      // Check for family collaboration elements
      const familyElements = await page.locator('text=/family|sarah|chen/i').count();
      console.log(`👥 Found ${familyElements} family-related elements`);

      // Check for tab navigation
      const tabElements = await page.locator('[role="tab"], [role="tablist"] button, nav button').count();
      console.log(`📑 Found ${tabElements} tab navigation elements`);

      await page.screenshot({ path: 'verification-04-main-app.png' });
      console.log('📸 Screenshot: verification-04-main-app.png');

      // Test tab navigation if available
      if (tabElements > 0) {
        console.log('📝 Step 6: Testing tab navigation...');
        const tabs = await page.locator('[role="tab"], [role="tablist"] button, nav button').all();

        for (let i = 0; i < Math.min(tabs.length, 3); i++) {
          try {
            await tabs[i].click();
            await page.waitForTimeout(2000);
            console.log(`✅ Tab ${i + 1} navigation successful`);
          } catch (e) {
            console.log(`⚠️  Tab ${i + 1} navigation failed: ${e.message}`);
          }
        }
      }

      await page.screenshot({ path: 'verification-05-final-state.png' });
      console.log('📸 Screenshot: verification-05-final-state.png');

      return {
        status: 'SUCCESS',
        authElements,
        appElements,
        familyElements,
        tabElements,
        consoleMessages: consoleMessages.length,
        pageErrors: pageErrors.length,
        criticalErrors: criticalErrors.length
      };

    } else {
      console.log('⚠️  No authentication elements found - checking if already logged in...');

      const appElements = await page.locator('button, a, div[role="button"]').count();
      if (appElements > 5) {
        console.log('✅ Application appears to be loaded and functional');
        return {
          status: 'ALREADY_AUTHENTICATED',
          appElements,
          consoleMessages: consoleMessages.length,
          pageErrors: pageErrors.length
        };
      } else {
        console.log('❌ Application not loaded properly');
        return {
          status: 'FAILED',
          reason: 'Application not loaded',
          appElements
        };
      }
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'verification-error.png' });
    return {
      status: 'ERROR',
      error: error.message,
      consoleMessages: consoleMessages.length,
      pageErrors: pageErrors.length
    };
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyNestSyncApplication()
  .then(result => {
    console.log('');
    console.log('📋 VERIFICATION RESULTS:');
    console.log('========================');
    console.log(JSON.stringify(result, null, 2));

    if (result.status === 'SUCCESS') {
      console.log('');
      console.log('✅ APPLICATION VERIFICATION SUCCESSFUL');
      console.log('🎉 Your claim that "it\'s working well now" appears to be CORRECT!');
    } else if (result.status === 'FAILED') {
      console.log('');
      console.log('❌ APPLICATION VERIFICATION FAILED');
      console.log('🚨 Issues detected that need investigation');
    }
  })
  .catch(error => {
    console.error('💥 Verification script failed:', error);
  });