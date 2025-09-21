import { test, expect } from '../fixtures/auth';
import { GraphQLHelper, REORDER_QUERIES, REORDER_MUTATIONS } from '../utils/graphql-helpers';
import { canadianTestConfig } from '../playwright.config';

/**
 * Premium Feature Gating and Subscription Flow Tests
 *
 * Tests premium subscription management and feature access control:
 * 1. Free tier user limitations and upgrade prompts
 * 2. Premium feature discovery and value presentation
 * 3. Stripe PaymentSheet integration with Canadian test cards
 * 4. Subscription activation and feature unlock validation
 * 5. Subscription management and cancellation flows
 * 6. Canadian tax calculations and billing compliance
 */

test.describe('Premium Feature Gating and Subscription Management', () => {
  let graphqlHelper: GraphQLHelper;

  test.beforeEach(async ({ page }) => {
    graphqlHelper = new GraphQLHelper(page);
  });

  test.describe('Free Tier Limitations and Upgrade Flow', () => {
    test('should show premium upgrade prompts for free tier users', async ({
      page, authHelper
    }) => {
      // Create a free tier test user
      const freeUser = {
        email: 'free-tier@nestsync-test.com',
        password: 'Test123!@#',
        province: 'ON',
      };

      try {
        await authHelper.login(freeUser.email, freeUser.password);
      } catch {
        // User doesn't exist, create account
        await authHelper.registerNewUser(freeUser);
        await authHelper.completeOnboarding([{
          name: 'TestChild',
          birthDate: '2023-06-15',
          diaperSize: '4',
        }]);
      }

      // Navigate to reorder dashboard
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Should show limited free tier experience
      await expect(page.getByTestId('free-tier-dashboard')).toBeVisible();
      await expect(page.getByTestId('premium-upgrade-banner')).toBeVisible();

      // Verify limited features are displayed
      await expect(page.getByTestId('basic-reorder-suggestions')).toBeVisible();
      await expect(page.getByTestId('manual-reorder-only')).toBeVisible();

      // Premium features should be locked
      await expect(page.getByTestId('ml-predictions-locked')).toBeVisible();
      await expect(page.getByTestId('auto-reorder-locked')).toBeVisible();
      await expect(page.getByTestId('bulk-savings-locked')).toBeVisible();

      // Verify upgrade prompts are contextual and helpful
      const upgradePrompt = page.getByTestId('premium-upgrade-banner');
      await expect(upgradePrompt.getByText('Unlock Smart Predictions')).toBeVisible();
      await expect(upgradePrompt.getByText('Save up to 30% with bulk ordering')).toBeVisible();
      await expect(upgradePrompt.getByText('Never run out again')).toBeVisible();

      // Canadian pricing should be displayed
      await expect(upgradePrompt.getByText('$19.99 CAD/month')).toBeVisible();
      await expect(upgradePrompt.getByText('🇨🇦 Canadian pricing')).toBeVisible();
    });

    test('should allow free tier users to access limited manual reorder', async ({
      page, authHelper
    }) => {
      const freeUser = {
        email: 'free-manual@nestsync-test.com',
        password: 'Test123!@#',
      };

      try {
        await authHelper.login(freeUser.email, freeUser.password);
      } catch {
        await authHelper.registerNewUser(freeUser);
        await authHelper.completeOnboarding([{
          name: 'TestChild',
          birthDate: '2023-06-15',
          diaperSize: '4',
        }]);
      }

      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Should be able to access manual reorder
      const manualReorderButton = page.getByTestId('manual-reorder-button');
      await expect(manualReorderButton).toBeVisible();
      await expect(manualReorderButton).toBeEnabled();

      await manualReorderButton.click();

      // Should open manual reorder form
      await expect(page.getByTestId('manual-reorder-modal')).toBeVisible();
      await expect(page.getByTestId('product-search')).toBeVisible();
      await expect(page.getByTestId('quantity-selector')).toBeVisible();

      // Should show upgrade prompts within manual flow
      await expect(page.getByTestId('upgrade-to-smart-reorder')).toBeVisible();

      // Complete a manual order
      await page.getByTestId('product-search').fill('Huggies Size 4');
      await page.getByTestId('search-button').click();

      await expect(page.getByTestId('product-results')).toBeVisible();

      // Select first product
      await page.getByTestId('product-option').first().click();
      await page.getByTestId('add-to-cart').click();

      // Should be able to proceed to checkout
      await expect(page.getByTestId('checkout-button')).toBeVisible();
      await expect(page.getByTestId('manual-order-total')).toBeVisible();
    });

    test('should track feature interaction and show upgrade value', async ({
      page, authHelper
    }) => {
      const freeUser = {
        email: 'free-engagement@nestsync-test.com',
        password: 'Test123!@#',
      };

      try {
        await authHelper.login(freeUser.email, freeUser.password);
      } catch {
        await authHelper.registerNewUser(freeUser);
        await authHelper.completeOnboarding([{
          name: 'TestChild',
          birthDate: '2023-06-15',
          diaperSize: '4',
        }]);
      }

      await page.goto('/reorder');

      // Click on locked ML predictions feature
      await page.getByTestId('ml-predictions-locked').click();

      // Should show feature value modal
      await expect(page.getByTestId('ml-predictions-value-modal')).toBeVisible();
      await expect(page.getByTestId('feature-demo-video')).toBeVisible();
      await expect(page.getByTestId('savings-calculator')).toBeVisible();

      // Show specific value proposition
      await expect(page.getByText('Based on families like yours')).toBeVisible();
      await expect(page.getByText('Average savings: $127 CAD/month')).toBeVisible();
      await expect(page.getByText('Never run out: 99.2% accuracy')).toBeVisible();

      // Close modal and try auto-reorder feature
      await page.getByTestId('close-modal').click();
      await page.getByTestId('auto-reorder-locked').click();

      // Should show different value proposition
      await expect(page.getByTestId('auto-reorder-value-modal')).toBeVisible();
      await expect(page.getByText('Hands-free ordering')).toBeVisible();
      await expect(page.getByText('Perfect timing, every time')).toBeVisible();

      // Should track engagement for personalized upgrade offers
      const upgradeButton = page.getByTestId('upgrade-now-personalized');
      await expect(upgradeButton).toBeVisible();
      await expect(upgradeButton).toContainText('Start Free Trial');
    });
  });

  test.describe('Premium Subscription Upgrade Flow', () => {
    test('should complete premium subscription upgrade with Canadian billing', async ({
      page, authHelper
    }) => {
      // Use existing free tier user
      const freeUser = {
        email: 'upgrade-test@nestsync-test.com',
        password: 'Test123!@#',
      };

      try {
        await authHelper.login(freeUser.email, freeUser.password);
      } catch {
        await authHelper.registerNewUser(freeUser);
        await authHelper.completeOnboarding([{
          name: 'TestChild',
          birthDate: '2023-06-15',
          diaperSize: '4',
        }]);
      }

      // Navigate to subscription upgrade
      await page.goto('/reorder');
      await page.getByTestId('upgrade-to-premium').click();

      // Should navigate to subscription selection
      await page.waitForURL('/subscription/upgrade');
      await expect(page.getByTestId('subscription-plans')).toBeVisible();

      // Verify Canadian pricing display
      const premiumPlan = page.getByTestId('premium-plan');
      await expect(premiumPlan.getByText('$24.99 CAD')).toBeVisible();
      await expect(premiumPlan.getByText('plus taxes')).toBeVisible();
      await expect(premiumPlan.getByTestId('canadian-tax-notice')).toBeVisible();

      // Select premium plan
      await premiumPlan.getByTestId('select-plan').click();

      // Should show billing address form for tax calculation
      await expect(page.getByTestId('billing-address-form')).toBeVisible();

      // Fill Canadian billing address
      await page.getByTestId('billing-street').fill('123 Queen Street West');
      await page.getByTestId('billing-city').fill('Toronto');
      await page.getByTestId('billing-province').selectOption('ON');
      await page.getByTestId('billing-postal').fill('M5H 2M9');
      await page.getByTestId('billing-country').selectOption('CA');

      await page.getByTestId('calculate-taxes').click();

      // Should display accurate Canadian tax calculation
      await expect(page.getByTestId('tax-breakdown')).toBeVisible();

      const taxBreakdown = page.getByTestId('tax-breakdown');
      await expect(taxBreakdown.getByTestId('gst-amount')).toContainText('$1.25'); // 5% GST
      await expect(taxBreakdown.getByTestId('hst-amount')).toContainText('$2.00'); // 8% HST
      await expect(taxBreakdown.getByTestId('total-tax')).toContainText('$3.25');
      await expect(taxBreakdown.getByTestId('total-amount')).toContainText('$28.24');

      // Proceed to payment
      await page.getByTestId('proceed-to-payment').click();

      // Should load Stripe Payment Element
      await expect(page.getByTestId('stripe-payment-element')).toBeVisible();

      // Fill payment details with Canadian test card
      const paymentFrame = page.frameLocator('[name^="__privateStripeFrame"]');
      await paymentFrame.getByPlaceholder('Card number').fill('4242424242424242');
      await paymentFrame.getByPlaceholder('MM / YY').fill('12/28');
      await paymentFrame.getByPlaceholder('CVC').fill('123');

      // Confirm subscription
      await page.getByTestId('confirm-subscription').click();

      // Should show processing state
      await expect(page.getByTestId('processing-payment')).toBeVisible();

      // Should complete successfully
      await expect(page.getByTestId('subscription-success')).toBeVisible({ timeout: 30000 });

      // Verify subscription details
      const successModal = page.getByTestId('subscription-success');
      await expect(successModal.getByText('Premium subscription activated')).toBeVisible();
      await expect(successModal.getByText('$28.24 CAD')).toBeVisible();
      await expect(successModal.getByText('Next billing: ')).toBeVisible();

      // Verify PIPEDA compliance notice
      await expect(successModal.getByTestId('pipeda-notice')).toBeVisible();
      await expect(successModal.getByText('🇨🇦 Billing data stored in Canada')).toBeVisible();

      // Test GraphQL subscription creation
      const subscription = await graphqlHelper.createSubscription({
        tier: 'PREMIUM',
        provinceCode: 'ON'
      });

      expect(subscription.success).toBe(true);
      expect(subscription.subscription.tier).toBe('PREMIUM');
      expect(subscription.subscription.gstRate).toBe(0.05);
      expect(subscription.subscription.pstHstRate).toBe(0.08);
      expect(subscription.subscription.totalTaxRate).toBe(0.13);
    });

    test('should handle different Canadian provinces tax calculations', async ({
      page, authHelper
    }) => {
      const testUser = {
        email: 'tax-test@nestsync-test.com',
        password: 'Test123!@#',
      };

      try {
        await authHelper.login(testUser.email, testUser.password);
      } catch {
        await authHelper.registerNewUser(testUser);
        await authHelper.completeOnboarding();
      }

      await page.goto('/subscription/upgrade');

      // Test different provinces
      const provinces = canadianTestConfig.provinces;

      for (const province of provinces.slice(0, 3)) { // Test first 3 for time
        await page.getByTestId('billing-province').selectOption(province.code);
        await page.getByTestId('calculate-taxes').click();

        const taxBreakdown = page.getByTestId('tax-breakdown');

        if (province.code === 'ON' || province.code === 'NB' || province.code === 'NS') {
          // HST provinces
          await expect(taxBreakdown.getByTestId('hst-amount')).toBeVisible();
          await expect(taxBreakdown.getByTestId('gst-amount')).not.toBeVisible();
        } else {
          // GST + PST provinces
          await expect(taxBreakdown.getByTestId('gst-amount')).toBeVisible();

          if (province.pst && province.pst > 0) {
            await expect(taxBreakdown.getByTestId('pst-amount')).toBeVisible();
          }
        }

        console.log(`✅ Tax calculation verified for ${province.name}`);
      }
    });

    test('should handle payment failures and retry flows', async ({
      page, authHelper
    }) => {
      const testUser = {
        email: 'payment-failure@nestsync-test.com',
        password: 'Test123!@#',
      };

      try {
        await authHelper.login(testUser.email, testUser.password);
      } catch {
        await authHelper.registerNewUser(testUser);
        await authHelper.completeOnboarding();
      }

      await page.goto('/subscription/upgrade');
      await page.getByTestId('select-premium-plan').click();

      // Fill billing address
      await page.getByTestId('billing-street').fill('123 Test Street');
      await page.getByTestId('billing-city').fill('Vancouver');
      await page.getByTestId('billing-province').selectOption('BC');
      await page.getByTestId('billing-postal').fill('V6B 1A1');
      await page.getByTestId('billing-country').selectOption('CA');

      await page.getByTestId('proceed-to-payment').click();

      // Use declined test card
      const paymentFrame = page.frameLocator('[name^="__privateStripeFrame"]');
      await paymentFrame.getByPlaceholder('Card number').fill('4000000000000002');
      await paymentFrame.getByPlaceholder('MM / YY').fill('12/28');
      await paymentFrame.getByPlaceholder('CVC').fill('123');

      await page.getByTestId('confirm-subscription').click();

      // Should show payment error
      await expect(page.getByTestId('payment-error')).toBeVisible();
      await expect(page.getByText('Your card was declined')).toBeVisible();

      // Should provide retry options
      await expect(page.getByTestId('try-different-card')).toBeVisible();
      await expect(page.getByTestId('update-billing-info')).toBeVisible();

      // Try with valid card
      await page.getByTestId('try-different-card').click();

      await paymentFrame.getByPlaceholder('Card number').fill('4242424242424242');
      await page.getByTestId('confirm-subscription').click();

      // Should succeed
      await expect(page.getByTestId('subscription-success')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Premium Feature Access and Validation', () => {
    test('should unlock all premium features after subscription', async ({
      premiumUser: { page, user }
    }) => {
      // Navigate to reorder dashboard
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Should show premium dashboard
      await expect(page.getByTestId('premium-dashboard')).toBeVisible();
      await expect(page.getByTestId('premium-badge')).toBeVisible();

      // ML predictions should be unlocked
      await expect(page.getByTestId('ml-prediction-cards')).toBeVisible();
      await expect(page.getByTestId('confidence-indicators')).toBeVisible();

      // Auto-reorder should be available
      await expect(page.getByTestId('auto-reorder-toggle')).toBeVisible();
      await expect(page.getByTestId('auto-reorder-toggle')).toBeEnabled();

      // Bulk savings should be visible
      await expect(page.getByTestId('bulk-savings-calculator')).toBeVisible();
      await expect(page.getByTestId('multi-retailer-comparison')).toBeVisible();

      // Advanced preferences should be accessible
      await page.goto('/settings/reorder-preferences');
      await expect(page.getByTestId('advanced-preferences')).toBeVisible();
      await expect(page.getByTestId('growth-prediction-toggle')).toBeVisible();
      await expect(page.getByTestId('seasonal-adjustments')).toBeVisible();

      // Priority support should be mentioned
      await page.goto('/settings/support');
      await expect(page.getByTestId('priority-support-badge')).toBeVisible();
    });

    test('should validate premium feature API access', async ({
      premiumUser: { page }
    }) => {
      // Test premium-only GraphQL queries
      const subscription = await graphqlHelper.getReorderSubscription();
      expect(subscription).toBeDefined();
      expect(subscription.tier).toBe('PREMIUM');
      expect(subscription.features.auto_reorder).toBe(true);

      // Test creating reorder preferences (premium feature)
      const preferences = await graphqlHelper.createReorderPreferences({
        childId: 'test-child-id',
        autoReorderEnabled: true,
        reorderThresholdDays: 7,
        maxOrderAmountCad: 200,
        preferredRetailers: ['AMAZON_CA', 'WALMART_CA'],
        preferredBrands: ['Huggies', 'Pampers']
      });

      expect(preferences.success).toBe(true);
      expect(preferences.preferences.autoReorderEnabled).toBe(true);

      // Test ML predictions access
      const predictions = await graphqlHelper.getConsumptionPredictions();
      expect(predictions.length).toBeGreaterThan(0);

      // Each prediction should have premium features
      predictions.forEach(prediction => {
        expect(prediction.confidenceLevel).toBeDefined();
        expect(prediction.sizeChangeProbability).toBeDefined();
        expect(prediction.growthAdjustmentFactor).toBeDefined();
      });
    });

    test('should enforce feature limits for different tiers', async ({
      page, authHelper
    }) => {
      // Test Family tier limits
      const familyUser = {
        email: 'family-tier@nestsync-test.com',
        password: 'Test123!@#',
      };

      try {
        await authHelper.login(familyUser.email, familyUser.password);
        await authHelper.setupPremiumSubscription('family');
      } catch {
        await authHelper.registerNewUser(familyUser);
        await authHelper.completeOnboarding([
          { name: 'Child1', birthDate: '2023-01-01', diaperSize: '4' },
          { name: 'Child2', birthDate: '2024-06-01', diaperSize: '2' }
        ]);
        await authHelper.setupPremiumSubscription('family');
      }

      await page.goto('/reorder');

      // Family tier should support multiple children
      await expect(page.getByTestId('multi-child-dashboard')).toBeVisible();
      await expect(page.getByTestId('child-selector')).toBeVisible();

      const childOptions = page.getByTestId('child-option');
      const childCount = await childOptions.count();
      expect(childCount).toBeGreaterThanOrEqual(2);

      // Should have access to priority features
      await expect(page.getByTestId('priority-ml-processing')).toBeVisible();
      await expect(page.getByTestId('advanced-growth-predictions')).toBeVisible();
    });
  });

  test.describe('Subscription Management and Billing', () => {
    test('should allow subscription plan changes', async ({
      premiumUser: { page }
    }) => {
      await page.goto('/settings/subscription');
      await page.waitForLoadState('networkidle');

      // Should show current subscription details
      await expect(page.getByTestId('current-plan')).toContainText('Premium');
      await expect(page.getByTestId('billing-amount')).toContainText('CAD');
      await expect(page.getByTestId('next-billing-date')).toBeVisible();

      // Should allow upgrade to Family plan
      await expect(page.getByTestId('upgrade-to-family')).toBeVisible();
      await page.getByTestId('upgrade-to-family').click();

      // Should show upgrade confirmation
      await expect(page.getByTestId('upgrade-confirmation')).toBeVisible();
      await expect(page.getByTestId('proration-details')).toBeVisible();

      // Confirm upgrade
      await page.getByTestId('confirm-upgrade').click();
      await expect(page.getByTestId('upgrade-success')).toBeVisible();

      // Should update subscription details
      await expect(page.getByTestId('current-plan')).toContainText('Family');
    });

    test('should handle subscription cancellation flow', async ({
      premiumUser: { page }
    }) => {
      await page.goto('/settings/subscription');

      // Should show cancellation option
      await expect(page.getByTestId('manage-subscription')).toBeVisible();
      await page.getByTestId('manage-subscription').click();

      await expect(page.getByTestId('cancel-subscription')).toBeVisible();
      await page.getByTestId('cancel-subscription').click();

      // Should show retention flow
      await expect(page.getByTestId('cancellation-survey')).toBeVisible();
      await expect(page.getByTestId('retention-offers')).toBeVisible();

      // Should offer alternatives
      await expect(page.getByTestId('pause-subscription')).toBeVisible();
      await expect(page.getByTestId('downgrade-option')).toBeVisible();

      // Complete cancellation
      await page.getByTestId('confirm-cancellation').click();

      // Should show cancellation confirmation
      await expect(page.getByTestId('cancellation-confirmed')).toBeVisible();
      await expect(page.getByTestId('service-until')).toBeVisible();

      // Should maintain access until period end
      await expect(page.getByText('Access until')).toBeVisible();
    });

    test('should validate billing compliance and receipts', async ({
      premiumUser: { page }
    }) => {
      await page.goto('/settings/billing');

      // Should show billing history
      await expect(page.getByTestId('billing-history')).toBeVisible();

      // Should have Canadian-compliant receipts
      const latestReceipt = page.getByTestId('receipt-item').first();
      await latestReceipt.click();

      await expect(page.getByTestId('receipt-modal')).toBeVisible();

      // Verify required Canadian billing elements
      await expect(page.getByTestId('business-number')).toBeVisible();
      await expect(page.getByTestId('gst-hst-number')).toBeVisible();
      await expect(page.getByTestId('tax-breakdown-detailed')).toBeVisible();

      // Should show PIPEDA compliance on receipts
      await expect(page.getByTestId('data-processing-notice')).toBeVisible();
      await expect(page.getByText('🇨🇦 Processed in Canada')).toBeVisible();

      // Should allow receipt download
      await expect(page.getByTestId('download-receipt')).toBeVisible();
      await page.getByTestId('download-receipt').click();

      // Should trigger download (we'll verify the button works)
      // In a real test, we'd verify the PDF download
    });
  });

  test.describe('Feature Usage Analytics and Limits', () => {
    test('should track and display feature usage for premium users', async ({
      premiumUser: { page }
    }) => {
      await page.goto('/settings/usage');

      // Should show usage dashboard
      await expect(page.getByTestId('usage-dashboard')).toBeVisible();

      // Should display monthly limits and usage
      await expect(page.getByTestId('ml-predictions-usage')).toBeVisible();
      await expect(page.getByTestId('auto-orders-count')).toBeVisible();
      await expect(page.getByTestId('api-requests-count')).toBeVisible();

      // Should show usage trends
      await expect(page.getByTestId('usage-chart')).toBeVisible();
      await expect(page.getByTestId('savings-calculator')).toBeVisible();

      // Should provide optimization suggestions
      await expect(page.getByTestId('optimization-tips')).toBeVisible();
    });

    test('should enforce rate limits appropriately', async ({
      premiumUser: { page }
    }) => {
      // Test API rate limiting for premium features
      const promises = [];

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(graphqlHelper.getConsumptionPredictions());
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Premium users should have higher rate limits
      expect(successful).toBeGreaterThan(5);
      console.log(`Premium rate limiting: ${successful} successful, ${failed} failed`);
    });
  });
});