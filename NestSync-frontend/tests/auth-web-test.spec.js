const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('=== NestSync Web Authentication & Data Loading Test ===\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // ===== TEST SCENARIO 1: Login & Profile Data =====
    console.log('\n=== TEST SCENARIO 1: Login & Profile Data ===\n');

    // Navigate to app
    console.log('Step 1: Navigate to http://localhost:8082');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('Step 2: Take screenshot of initial page');
    await page.screenshot({ path: path.join(screenshotsDir, '01-initial-page.png'), fullPage: true });
    console.log('✓ Screenshot saved: 01-initial-page.png');

    // Check if login form is visible
    console.log('\nStep 3: Check for login form elements');
    const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[placeholder*="password" i], input[name="password"]').first();

    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);

    console.log(`Email input visible: ${emailVisible}`);
    console.log(`Password input visible: ${passwordVisible}`);

    if (!emailVisible || !passwordVisible) {
      console.log('\n⚠ Login form not immediately visible. Checking for sign-in button...');

      // Try to find and click sign-in button
      const signInButton = await page.locator('button:has-text("Sign In"), button:has-text("Login"), a:has-text("Sign In"), a:has-text("Login")').first();
      const signInVisible = await signInButton.isVisible().catch(() => false);

      if (signInVisible) {
        console.log('✓ Found Sign In button, clicking...');
        await signInButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '02-after-signin-click.png'), fullPage: true });
      }
    }

    // Login with test credentials
    console.log('\nStep 4: Fill login form');
    await emailInput.fill('parents@nestsync.com');
    console.log('✓ Email filled: parents@nestsync.com');

    await passwordInput.fill('Shazam11#');
    console.log('✓ Password filled');

    await page.screenshot({ path: path.join(screenshotsDir, '03-login-form-filled.png'), fullPage: true });

    // Submit login
    console.log('\nStep 5: Submit login form');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();
    console.log('✓ Login submitted');

    // Wait for navigation or response
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotsDir, '04-after-login-submit.png'), fullPage: true });

    // Check for errors in console
    console.log('\nStep 6: Check browser console for errors');
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check for profile data
    console.log('\nStep 7: Check for profile data');
    const profileTexts = await page.locator('text=/Sarah Chen/i, text=/BC/i').allTextContents();
    console.log(`Profile data found: ${JSON.stringify(profileTexts)}`);

    if (profileTexts.length > 0) {
      console.log('✅ Profile data loaded successfully!');
    } else {
      console.log('❌ Profile data NOT found');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '05-profile-check.png'), fullPage: true });

    // ===== TEST SCENARIO 2: Children Data =====
    console.log('\n\n=== TEST SCENARIO 2: Children Data ===\n');

    // Try to navigate to children management
    console.log('Step 1: Look for children management or dashboard');

    // Check for navigation links
    const navLinks = await page.locator('a, button').allTextContents();
    console.log(`Available navigation: ${navLinks.slice(0, 10).join(', ')}...`);

    // Look for children-related content
    const childrenText = await page.locator('text=/Zee/i, text=/Damilare/i, text=/No Children/i').allTextContents();
    console.log(`Children-related text found: ${JSON.stringify(childrenText)}`);

    if (childrenText.length > 0) {
      console.log('✅ Children data found!');
    } else {
      console.log('❌ No children data found');

      // Try to navigate to children page
      const childrenLink = await page.locator('a:has-text("Children"), button:has-text("Children"), a:has-text("My Children")').first();
      const childrenLinkVisible = await childrenLink.isVisible().catch(() => false);

      if (childrenLinkVisible) {
        console.log('\nNavigating to Children page...');
        await childrenLink.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(screenshotsDir, '06-children-page.png'), fullPage: true });

        const childrenTextAfter = await page.locator('text=/Zee/i, text=/Damilare/i, text=/No Children/i').allTextContents();
        console.log(`Children text after navigation: ${JSON.stringify(childrenTextAfter)}`);
      }
    }

    // ===== TEST SCENARIO 3: Grid Layout =====
    console.log('\n\n=== TEST SCENARIO 3: Grid Layout (iPhone 17 Pro) ===\n');

    // Set iPhone 17 Pro viewport
    console.log('Step 1: Set viewport to iPhone 17 Pro (393x852)');
    await page.setViewportSize({ width: 393, height: 852 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '07-iphone-viewport.png'), fullPage: true });

    // Look for dashboard or inventory cards
    console.log('\nStep 2: Check for inventory status cards');
    const cards = await page.locator('[class*="card"], [class*="Card"], [role="article"]').all();
    console.log(`Found ${cards.length} card-like elements`);

    // Get card positions
    if (cards.length >= 4) {
      console.log('\nStep 3: Measure card positions');
      for (let i = 0; i < Math.min(4, cards.length); i++) {
        const box = await cards[i].boundingBox();
        if (box) {
          console.log(`Card ${i + 1}: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
        }
      }
    } else {
      console.log(`⚠ Expected at least 4 cards, found ${cards.length}`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '08-grid-layout-final.png'), fullPage: true });

    // ===== NETWORK & GRAPHQL ANALYSIS =====
    console.log('\n\n=== NETWORK & GRAPHQL ANALYSIS ===\n');

    // Check for GraphQL errors
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Navigate back to desktop view for GraphQL check
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\nChecking for GraphQL queries...');
    const graphqlRequests = [];
    page.on('request', request => {
      if (request.url().includes('graphql')) {
        graphqlRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    await page.waitForTimeout(2000);

    console.log(`\nGraphQL requests detected: ${graphqlRequests.length}`);
    if (graphqlRequests.length > 0) {
      console.log('GraphQL queries:', JSON.stringify(graphqlRequests.slice(0, 3), null, 2));
    }

    if (networkErrors.length > 0) {
      console.log('\n⚠ Network errors detected:');
      networkErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ No network errors detected');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '09-final-state.png'), fullPage: true });

    console.log('\n\n=== TEST COMPLETE ===');
    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
    console.log('\nTest Summary:');
    console.log(`- Login attempt: Completed`);
    console.log(`- Profile data: ${profileTexts.length > 0 ? '✅ Found' : '❌ Not found'}`);
    console.log(`- Children data: ${childrenText.length > 0 ? '✅ Found' : '❌ Not found'}`);
    console.log(`- Cards detected: ${cards.length}`);
    console.log(`- GraphQL requests: ${graphqlRequests.length}`);
    console.log(`- Network errors: ${networkErrors.length}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-screenshot.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
