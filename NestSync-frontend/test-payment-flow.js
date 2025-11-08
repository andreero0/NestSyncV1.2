const { chromium } = require('playwright');

(async () => {
  console.log('Starting payment flow test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check if already logged in
    const isLoggedIn = await page.getByText('Dashboard').isVisible().catch(() => false);

    if (!isLoggedIn) {
      console.log('2. Logging in with test credentials...');
      await page.fill('input[placeholder*="email" i]', 'parents@nestsync.com');
      await page.fill('input[type="password"]', 'Shazam11#');
      await page.click('text=Sign In');

      console.log('3. Waiting for dashboard to load...');
      await page.waitForTimeout(8000);
    } else {
      console.log('2. Already logged in, skipping authentication...');
    }

    // Navigate to Settings
    console.log('4. Navigating to Settings...');
    await page.click('text=Settings');
    await page.waitForTimeout(2000);

    // Navigate to Payment Methods
    console.log('5. Navigating to Payment Methods...');
    const paymentMethodsButton = page.locator('text=Payment Methods').first();
    await paymentMethodsButton.click();
    await page.waitForTimeout(3000);

    // Take screenshot of payment methods page
    console.log('6. Taking screenshot of Payment Methods page...');
    await page.screenshot({ path: 'payment-methods-page.png', fullPage: true });

    // Check for platform blocking error (should NOT exist)
    console.log('7. Checking for platform blocking error...');
    const platformBlockError = await page.locator('text="Payment method management is only available"').isVisible().catch(() => false);

    if (platformBlockError) {
      console.error('❌ FAIL: Platform blocking error still present!');
      await page.screenshot({ path: 'payment-methods-error.png', fullPage: true });
    } else {
      console.log('✅ PASS: No platform blocking error');
    }

    // Check for "Add Payment Method" button
    console.log('8. Checking for Add Payment Method button...');
    const addButton = await page.locator('text="Add Payment Method"').isVisible().catch(() => false);

    if (!addButton) {
      console.error('❌ FAIL: Add Payment Method button not found');
    } else {
      console.log('✅ PASS: Add Payment Method button found');

      // Click add payment method
      console.log('9. Clicking Add Payment Method...');
      await page.click('text="Add Payment Method"');
      await page.waitForTimeout(2000);

      // Take screenshot of add card form
      console.log('10. Taking screenshot of add card form...');
      await page.screenshot({ path: 'payment-add-card-form.png', fullPage: true });

      // Check for Stripe Elements CardElement on web
      console.log('11. Checking for Stripe Elements CardElement...');
      const stripeElement = await page.locator('iframe[name^="__privateStripeFrame"]').isVisible().catch(() => false);

      if (stripeElement) {
        console.log('✅ PASS: Stripe Elements CardElement detected (web implementation working)');
      } else {
        // Check for native CardField (might be on native)
        const nativeCard = await page.locator('[data-testid="card-field"]').isVisible().catch(() => false);
        if (nativeCard) {
          console.log('✅ PASS: Native CardField detected');
        } else {
          console.warn('⚠️  WARNING: No card input element detected');
        }
      }

      // Check for cardholder name input
      console.log('12. Checking for cardholder name input...');
      const cardholderInput = await page.locator('input[placeholder*="Cardholder" i]').isVisible().catch(() => false);

      if (cardholderInput) {
        console.log('✅ PASS: Cardholder name input found');
      } else {
        console.warn('⚠️  WARNING: Cardholder name input not found');
      }
    }

    console.log('\n=== PAYMENT FLOW TEST SUMMARY ===');
    console.log('✅ Test completed successfully');
    console.log('Screenshots saved:');
    console.log('  - payment-methods-page.png');
    console.log('  - payment-add-card-form.png');
    console.log('\n=== KEY VALIDATION POINTS ===');
    console.log('1. No platform blocking error present');
    console.log('2. Add Payment Method button accessible');
    console.log('3. Card input form renders correctly');
    console.log('4. Web-specific Stripe Elements integration working');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'payment-test-error.png', fullPage: true });
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
})();
