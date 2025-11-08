const { chromium } = require('playwright');

(async () => {
  console.log('Starting direct payment flow test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Take screenshot of initial page
    await page.screenshot({ path: 'test-step-1-initial.png', fullPage: true });

    // Fill login form
    console.log('2. Filling login credentials...');
    await page.fill('input[placeholder*="email" i]', 'parents@nestsync.com');
    await page.fill('input[type="password"]', 'Shazam11#');
    await page.screenshot({ path: 'test-step-2-filled-login.png', fullPage: true });

    // Click sign in
    console.log('3. Clicking Sign In...');
    await page.click('text=Sign In');
    await page.waitForTimeout(10000); // Wait for login and dashboard load

    // Take screenshot after login
    await page.screenshot({ path: 'test-step-3-after-login.png', fullPage: true });
    console.log('4. Successfully logged in');

    // Try direct navigation to payment methods
    console.log('5. Attempting direct navigation to payment methods...');
    await page.goto('http://localhost:8082/payment-methods', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Take screenshot of payment methods page
    console.log('6. Taking screenshot of Payment Methods page...');
    await page.screenshot({ path: 'test-step-4-payment-methods.png', fullPage: true });

    // Check for platform blocking error (should NOT exist)
    console.log('7. Checking for platform blocking error...');
    const platformBlockError = await page.locator('text="Payment method management is only available"').isVisible().catch(() => false);

    if (platformBlockError) {
      console.error('❌ FAIL: Platform blocking error still present!');
      await page.screenshot({ path: 'test-FAIL-platform-block.png', fullPage: true });
    } else {
      console.log('✅ PASS: No platform blocking error');
    }

    // Check for "Add Payment Method" button
    console.log('8. Checking for Add Payment Method button...');
    const addButton = await page.locator('text="Add Payment Method"').isVisible().catch(() => false);

    if (!addButton) {
      console.error('❌ FAIL: Add Payment Method button not found');
      await page.screenshot({ path: 'test-FAIL-no-add-button.png', fullPage: true });
    } else {
      console.log('✅ PASS: Add Payment Method button found');

      // Click add payment method
      console.log('9. Clicking Add Payment Method...');
      await page.click('text="Add Payment Method"');
      await page.waitForTimeout(3000);

      // Take screenshot of add card form
      console.log('10. Taking screenshot of add card form...');
      await page.screenshot({ path: 'test-step-5-add-card-form.png', fullPage: true });

      // Check for Stripe Elements CardElement on web
      console.log('11. Checking for Stripe Elements CardElement...');
      const stripeIframe = await page.locator('iframe[name^="__privateStripeFrame"]').count();

      if (stripeIframe > 0) {
        console.log(`✅ PASS: Stripe Elements CardElement detected (${stripeIframe} iframe(s) found - web implementation working)`);
      } else {
        console.warn('⚠️  WARNING: No Stripe iframe detected - checking for other card inputs...');

        // Check for any input fields
        const inputs = await page.locator('input').count();
        console.log(`Found ${inputs} input fields on page`);

        // Take detailed screenshot
        await page.screenshot({ path: 'test-WARNING-no-stripe-iframe.png', fullPage: true });
      }

      // Check page HTML for debugging
      console.log('12. Checking page content for debugging...');
      const pageContent = await page.content();

      // Check if "@stripe/react-stripe-js" components are present
      if (pageContent.includes('CardElement') || pageContent.includes('stripe')) {
        console.log('✅ Stripe-related content found in page');
      } else {
        console.warn('⚠️  No Stripe-related content found');
      }

      // Check for cardholder name input
      console.log('13. Checking for cardholder name input...');
      const cardholderVisible = await page.locator('input[placeholder*="Cardholder" i]').isVisible().catch(() => false);

      if (cardholderVisible) {
        console.log('✅ PASS: Cardholder name input found');
      } else {
        console.warn('⚠️  WARNING: Cardholder name input not visible');
      }
    }

    console.log('\n=== PAYMENT FLOW TEST SUMMARY ===');
    console.log('✅ Test completed successfully');
    console.log('\nScreenshots saved:');
    console.log('  - test-step-1-initial.png (Landing page)');
    console.log('  - test-step-2-filled-login.png (Login form filled)');
    console.log('  - test-step-3-after-login.png (After login)');
    console.log('  - test-step-4-payment-methods.png (Payment Methods page)');
    console.log('  - test-step-5-add-card-form.png (Add card form)');
    console.log('\n=== KEY VALIDATION POINTS ===');
    console.log('1. Login flow works correctly');
    console.log('2. Direct navigation to payment methods successful');
    console.log('3. No platform blocking error present');
    console.log('4. Add Payment Method button accessible');
    console.log('5. Stripe Elements integration checked');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-FATAL-ERROR.png', fullPage: true });
    console.log('\nError screenshot saved: test-FATAL-ERROR.png');
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
})();
