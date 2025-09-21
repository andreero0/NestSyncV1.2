import { test, expect } from '../fixtures/auth';
import { GraphQLHelper, REORDER_QUERIES, REORDER_MUTATIONS } from '../utils/graphql-helpers';
import { performanceThresholds } from '../playwright.config';

/**
 * End-to-End Complete Reorder Flow Tests
 *
 * Tests the complete user journey from ML prediction to order completion:
 * 1. User authentication and subscription validation
 * 2. ML prediction generation and confidence scoring
 * 3. Multi-retailer comparison with Canadian pricing
 * 4. Order creation and payment processing
 * 5. Real-time tracking and delivery confirmation
 * 6. PIPEDA compliance and audit trail validation
 */

test.describe('Complete Reorder Flow - End-to-End Journey', () => {
  let graphqlHelper: GraphQLHelper;

  test.beforeEach(async ({ page }) => {
    graphqlHelper = new GraphQLHelper(page);
    // Verify GraphQL schema is available
    await graphqlHelper.validateSchema();
  });

  test.describe('Happy Path - Complete Reorder Journey', () => {
    test('should complete full reorder flow from prediction to delivery', async ({
      primaryUser: { page, user }
    }) => {
      test.slow(); // Mark as slow test due to complex flow

      // =================================================================
      // STEP 1: Navigate to Dashboard and Verify Subscription
      // =================================================================
      console.log('Step 1: Verifying user subscription and access');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify user is authenticated and has access to reorder features
      await expect(page.getByTestId('user-menu')).toBeVisible();
      await expect(page.getByTestId('dashboard-content')).toBeVisible();

      // Check subscription status via GraphQL
      const subscription = await graphqlHelper.getReorderSubscription();
      console.log('User subscription:', subscription);

      // =================================================================
      // STEP 2: Access Reorder Dashboard and Verify ML Predictions
      // =================================================================
      console.log('Step 2: Accessing reorder dashboard and ML predictions');

      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Wait for ML predictions to load
      await expect(page.getByTestId('reorder-dashboard')).toBeVisible();
      await expect(page.getByTestId('prediction-loading')).not.toBeVisible({ timeout: 10000 });

      // Verify ML prediction cards are displayed
      const predictionCards = page.getByTestId('reorder-suggestion-card');
      await expect(predictionCards.first()).toBeVisible();

      // Get predictions via GraphQL to validate data consistency
      const predictions = await graphqlHelper.getConsumptionPredictions();
      expect(predictions.length).toBeGreaterThan(0);

      console.log(`Found ${predictions.length} ML predictions`);

      // Validate prediction confidence levels
      for (const prediction of predictions) {
        expect(prediction.confidenceLevel).toBeGreaterThan(0);
        expect(prediction.confidenceLevel).toBeLessThanOrEqual(100);
        expect(prediction.predictedRunoutDate).toBeDefined();
        expect(prediction.recommendedReorderDate).toBeDefined();
      }

      // =================================================================
      // STEP 3: Select High-Confidence Prediction for Reorder
      // =================================================================
      console.log('Step 3: Selecting high-confidence prediction for reorder');

      // Find the highest confidence prediction
      const highestConfidencePrediction = predictions.reduce((prev, current) =>
        prev.confidenceLevel > current.confidenceLevel ? prev : current
      );

      console.log('Selected prediction:', {
        id: highestConfidencePrediction.id,
        confidence: highestConfidencePrediction.confidenceLevel,
        runoutDate: highestConfidencePrediction.predictedRunoutDate
      });

      // Click on the corresponding prediction card
      const selectedCard = page.getByTestId(`reorder-suggestion-card-${highestConfidencePrediction.childId}`);
      await expect(selectedCard).toBeVisible();

      // Verify ML confidence indicator
      const confidenceIndicator = selectedCard.getByTestId('ml-confidence-indicator');
      await expect(confidenceIndicator).toBeVisible();

      const confidenceText = await confidenceIndicator.textContent();
      expect(confidenceText).toContain(`${Math.round(highestConfidencePrediction.confidenceLevel)}%`);

      // =================================================================
      // STEP 4: Compare Canadian Retailer Prices
      // =================================================================
      console.log('Step 4: Comparing Canadian retailer prices');

      // Click "Compare Prices" to see retailer options
      await selectedCard.getByTestId('compare-prices-button').click();

      // Wait for retailer comparison modal
      await expect(page.getByTestId('retailer-comparison-modal')).toBeVisible();

      // Verify Canadian retailers are shown
      const canadianRetailers = [
        'amazon-ca',
        'walmart-ca',
        'loblaws-ca',
        'costco-ca'
      ];

      for (const retailer of canadianRetailers) {
        const retailerCard = page.getByTestId(`retailer-option-${retailer}`);
        if (await retailerCard.isVisible()) {
          console.log(`Verified Canadian retailer: ${retailer}`);

          // Verify Canadian pricing elements
          await expect(retailerCard.getByTestId('price-cad')).toBeVisible();
          await expect(retailerCard.getByTestId('tax-breakdown')).toBeVisible();
          await expect(retailerCard.getByTestId('canadian-trust-badge')).toBeVisible();

          // Validate tax calculation display
          const taxBreakdown = retailerCard.getByTestId('tax-breakdown');
          const taxText = await taxBreakdown.textContent();
          expect(taxText).toMatch(/(GST|HST|PST)/);
        }
      }

      // Search for products via GraphQL to verify pricing data
      const productSearch = await graphqlHelper.searchProducts({
        diaperSize: '4', // Based on our test user's child
        retailerType: 'AMAZON_CA'
      });

      expect(productSearch.success).toBe(true);
      expect(productSearch.products.length).toBeGreaterThan(0);

      console.log(`Found ${productSearch.products.length} products from Amazon CA`);

      // =================================================================
      // STEP 5: Select Best Price Option
      // =================================================================
      console.log('Step 5: Selecting best price option');

      // Find the best price option (lowest total including taxes)
      const bestPriceOption = page.getByTestId('best-price-indicator').first();
      await expect(bestPriceOption).toBeVisible();

      const bestRetailerCard = bestPriceOption.locator('..').first(); // Parent card
      await bestRetailerCard.getByTestId('select-retailer-button').click();

      // Verify selection confirmation
      await expect(page.getByTestId('retailer-selected-confirmation')).toBeVisible();

      // Close comparison modal
      await page.getByTestId('close-comparison-modal').click();
      await expect(page.getByTestId('retailer-comparison-modal')).not.toBeVisible();

      // =================================================================
      // STEP 6: Initiate Reorder Process
      // =================================================================
      console.log('Step 6: Initiating reorder process');

      // Click "Reorder Now" on the selected prediction card
      await selectedCard.getByTestId('reorder-now-button').click();

      // Wait for reorder confirmation modal
      await expect(page.getByTestId('reorder-confirmation-modal')).toBeVisible();

      // Verify order summary
      const orderSummary = page.getByTestId('order-summary');
      await expect(orderSummary).toBeVisible();

      // Verify Canadian compliance elements
      await expect(orderSummary.getByTestId('canadian-data-notice')).toBeVisible();
      await expect(orderSummary.getByTestId('pipeda-compliance-notice')).toBeVisible();

      // Verify pricing breakdown
      await expect(orderSummary.getByTestId('subtotal-cad')).toBeVisible();
      await expect(orderSummary.getByTestId('tax-amount-cad')).toBeVisible();
      await expect(orderSummary.getByTestId('total-amount-cad')).toBeVisible();

      // =================================================================
      // STEP 7: Complete Payment Process (Test Mode)
      // =================================================================
      console.log('Step 7: Completing payment process');

      // Verify payment section loads
      await expect(page.getByTestId('payment-section')).toBeVisible();

      // For premium users, payment method should be pre-filled
      const savedPaymentMethod = page.getByTestId('saved-payment-method');
      if (await savedPaymentMethod.isVisible()) {
        console.log('Using saved payment method');
        await savedPaymentMethod.check();
      } else {
        console.log('Entering new payment details');

        // Fill payment details with Canadian test card
        await page.getByTestId('card-number').fill('4242424242424242');
        await page.getByTestId('card-expiry').fill('12/28');
        await page.getByTestId('card-cvc').fill('123');
        await page.getByTestId('card-postal').fill('M5H 2M9'); // Toronto postal code

        // Verify Canadian postal code validation
        await expect(page.getByTestId('postal-code-valid')).toBeVisible();
      }

      // Confirm order placement
      const confirmOrderButton = page.getByTestId('confirm-order-button');
      await expect(confirmOrderButton).toBeEnabled();

      // Measure order processing time
      const orderStartTime = Date.now();
      await confirmOrderButton.click();

      // Wait for order confirmation
      await expect(page.getByTestId('order-success-confirmation')).toBeVisible({
        timeout: 30000
      });

      const orderProcessingTime = Date.now() - orderStartTime;
      console.log(`Order processing completed in ${orderProcessingTime}ms`);

      // Verify order processing time meets performance requirements
      expect(orderProcessingTime).toBeLessThan(performanceThresholds.premiumActivation);

      // =================================================================
      // STEP 8: Verify Order Creation and Tracking
      // =================================================================
      console.log('Step 8: Verifying order creation and tracking setup');

      // Extract order number from confirmation
      const orderConfirmation = page.getByTestId('order-success-confirmation');
      const orderNumberElement = orderConfirmation.getByTestId('order-number');
      const orderNumber = await orderNumberElement.textContent();

      expect(orderNumber).toMatch(/^NS\d{8}$/); // NestSync order format
      console.log(`Created order: ${orderNumber}`);

      // Verify tracking information is initialized
      await expect(orderConfirmation.getByTestId('tracking-info')).toBeVisible();
      await expect(orderConfirmation.getByTestId('estimated-delivery')).toBeVisible();

      // Navigate to order tracking page
      await orderConfirmation.getByTestId('track-order-button').click();
      await page.waitForURL('/orders/**');

      // Verify order tracking page loads
      await expect(page.getByTestId('order-tracking-page')).toBeVisible();
      await expect(page.getByTestId('order-status-timeline')).toBeVisible();

      // =================================================================
      // STEP 9: Test Real-Time Order Updates
      // =================================================================
      console.log('Step 9: Testing real-time order updates');

      // Set up WebSocket monitoring for real-time updates
      const wsPromise = page.waitForEvent('websocket');

      // Trigger a status update (in test mode, this would be simulated)
      await page.getByTestId('simulate-status-update').click();

      // Wait for WebSocket connection
      const ws = await wsPromise;
      console.log('WebSocket connection established for real-time tracking');

      // Wait for real-time status update
      await expect(page.getByTestId('status-update-notification')).toBeVisible({
        timeout: 15000
      });

      // Verify status timeline updates
      const statusTimeline = page.getByTestId('order-status-timeline');
      await expect(statusTimeline.getByTestId('status-confirmed')).toBeVisible();

      // =================================================================
      // STEP 10: Validate PIPEDA Compliance and Audit Trail
      // =================================================================
      console.log('Step 10: Validating PIPEDA compliance and audit trail');

      // Navigate to privacy dashboard
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');

      // Verify order appears in data usage audit
      const dataUsageLog = page.getByTestId('data-usage-audit');
      await expect(dataUsageLog).toBeVisible();

      // Check for order creation entry
      const orderAuditEntry = dataUsageLog.getByTestId(`audit-entry-${orderNumber}`);
      await expect(orderAuditEntry).toBeVisible();

      // Verify audit entry contains required information
      await expect(orderAuditEntry.getByTestId('data-type')).toContainText('Order Processing');
      await expect(orderAuditEntry.getByTestId('purpose')).toContainText('Automated Reorder');
      await expect(orderAuditEntry.getByTestId('retention-period')).toBeVisible();

      // Verify Canadian data residency notice
      await expect(page.getByTestId('canadian-data-residency')).toBeVisible();
      await expect(page.getByText('🇨🇦 Data stored in Canada')).toBeVisible();

      // =================================================================
      // STEP 11: Verify Email Confirmation and Communication
      // =================================================================
      console.log('Step 11: Verifying email confirmation and communication');

      // In a real test environment, we would check email delivery
      // For this test, we verify the email confirmation UI elements
      await page.goto('/dashboard');

      // Check for order confirmation notification
      const notificationPanel = page.getByTestId('notification-panel');
      if (await notificationPanel.isVisible()) {
        const orderNotification = notificationPanel.getByTestId(`order-${orderNumber}-confirmation`);
        await expect(orderNotification).toBeVisible();
      }

      // Verify email preferences are respected
      await page.goto('/settings/notifications');
      const emailNotifications = page.getByTestId('email-notifications');
      await expect(emailNotifications.getByTestId('order-confirmations')).toBeChecked();

      // =================================================================
      // STEP 12: Performance and Analytics Validation
      // =================================================================
      console.log('Step 12: Validating performance metrics and analytics');

      // Test ML prediction performance
      const predictionStartTime = Date.now();
      const newPredictions = await graphqlHelper.getConsumptionPredictions(
        highestConfidencePrediction.childId
      );
      const predictionTime = Date.now() - predictionStartTime;

      console.log(`ML prediction query completed in ${predictionTime}ms`);
      expect(predictionTime).toBeLessThan(performanceThresholds.mlPrediction);

      // Test GraphQL query performance
      const performance = await graphqlHelper.measureQueryPerformance(
        REORDER_QUERIES.GET_SUBSCRIPTION_DASHBOARD,
        {},
        3
      );

      console.log('GraphQL performance metrics:', performance);
      expect(performance.averageTime).toBeLessThan(performanceThresholds.graphqlQuery);

      // =================================================================
      // FINAL VALIDATION: Complete Flow Success
      // =================================================================
      console.log('Final validation: Complete reorder flow success');

      // Verify the entire flow created proper records
      const orderHistory = await graphqlHelper.query(REORDER_QUERIES.GET_ORDER_HISTORY, {
        limit: 1
      });

      expect(orderHistory.errors).toBeUndefined();
      expect(orderHistory.data.getOrderHistory).toBeDefined();
      expect(orderHistory.data.getOrderHistory.length).toBeGreaterThan(0);

      const latestOrder = orderHistory.data.getOrderHistory[0];
      expect(latestOrder.orderNumber).toBe(orderNumber);
      expect(latestOrder.status).toBe('CONFIRMED');
      expect(latestOrder.totalAmountCad).toBeGreaterThan(0);

      console.log('✅ Complete reorder flow test passed successfully');
      console.log(`Order ${orderNumber} completed with total: $${latestOrder.totalAmountCad} CAD`);
    });

    test('should handle premium subscription upgrade during reorder flow', async ({
      page, authHelper
    }) => {
      // Test user without premium subscription
      const freeUser = {
        email: 'free@nestsync-test.com',
        password: 'Test123!@#',
      };

      // Login with free tier user
      await authHelper.login(freeUser.email, freeUser.password);

      // Navigate to reorder dashboard
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Should see premium upgrade prompt
      await expect(page.getByTestId('premium-upgrade-prompt')).toBeVisible();

      // Click upgrade button
      await page.getByTestId('upgrade-to-premium').click();

      // Should navigate to subscription page
      await page.waitForURL('/settings/subscription');

      // Complete subscription upgrade
      await page.getByTestId('select-premium-plan').click();

      // Fill payment details
      await page.getByTestId('card-number').fill('4242424242424242');
      await page.getByTestId('card-expiry').fill('12/28');
      await page.getByTestId('card-cvc').fill('123');
      await page.getByTestId('card-postal').fill('M5H 2M9');

      // Confirm subscription
      await page.getByTestId('confirm-subscription').click();

      // Wait for subscription activation
      await expect(page.getByTestId('subscription-success')).toBeVisible();

      // Return to reorder dashboard
      await page.goto('/reorder');

      // Should now have access to premium features
      await expect(page.getByTestId('ml-prediction-cards')).toBeVisible();
      await expect(page.getByTestId('premium-upgrade-prompt')).not.toBeVisible();
    });

    test('should handle error scenarios gracefully', async ({
      primaryUser: { page }
    }) => {
      // Test network failure during order process
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Select a prediction card
      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();

      // Simulate network failure
      await page.route('**/graphql', route => route.abort());

      // Try to confirm order
      await page.getByTestId('confirm-order-button').click();

      // Should show error message
      await expect(page.getByTestId('order-error-message')).toBeVisible();
      await expect(page.getByTestId('retry-order-button')).toBeVisible();

      // Restore network and retry
      await page.unroute('**/graphql');
      await page.getByTestId('retry-order-button').click();

      // Should eventually succeed
      await expect(page.getByTestId('order-success-confirmation')).toBeVisible({
        timeout: 30000
      });
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle ML prediction service unavailability', async ({
      primaryUser: { page }
    }) => {
      // Mock ML service failure
      await page.route('**/predictions**', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'ML service temporarily unavailable' }]
          })
        });
      });

      await page.goto('/reorder');

      // Should show fallback UI
      await expect(page.getByTestId('ml-service-unavailable')).toBeVisible();
      await expect(page.getByTestId('manual-reorder-option')).toBeVisible();

      // User should be able to manually create orders
      await page.getByTestId('manual-reorder-option').click();
      await expect(page.getByTestId('manual-order-form')).toBeVisible();
    });

    test('should handle retailer API timeouts with fallback options', async ({
      primaryUser: { page }
    }) => {
      // Mock retailer API timeout
      await page.route('**/retailer/**', route => {
        // Simulate timeout after 30 seconds
        setTimeout(() => route.abort(), 30000);
      });

      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('compare-prices-button').click();

      // Should show loading state and then fallback options
      await expect(page.getByTestId('retailer-loading')).toBeVisible();
      await expect(page.getByTestId('retailer-timeout-notice')).toBeVisible({ timeout: 35000 });
      await expect(page.getByTestId('cached-prices-available')).toBeVisible();
    });

    test('should handle payment processing failures', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();

      // Use declined test card
      await page.getByTestId('card-number').fill('4000000000000002');
      await page.getByTestId('card-expiry').fill('12/28');
      await page.getByTestId('card-cvc').fill('123');
      await page.getByTestId('card-postal').fill('M5H 2M9');

      await page.getByTestId('confirm-order-button').click();

      // Should show payment error
      await expect(page.getByTestId('payment-error-message')).toBeVisible();
      await expect(page.getByTestId('payment-retry-options')).toBeVisible();

      // Should allow payment method update
      await page.getByTestId('update-payment-method').click();
      await expect(page.getByTestId('payment-method-form')).toBeVisible();
    });
  });

  test.describe('Cross-Platform Consistency', () => {
    test('should provide consistent experience across viewport sizes', async ({
      primaryUser: { page }
    }) => {
      const viewports = [
        { width: 320, height: 568 },  // iPhone SE
        { width: 768, height: 1024 }, // iPad
        { width: 1440, height: 900 }, // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/reorder');
        await page.waitForLoadState('networkidle');

        // Core elements should be visible at all viewport sizes
        await expect(page.getByTestId('reorder-dashboard')).toBeVisible();
        await expect(page.getByTestId('reorder-suggestion-card').first()).toBeVisible();

        // Touch targets should meet accessibility requirements
        const reorderButton = page.getByTestId('reorder-now-button').first();
        const boundingBox = await reorderButton.boundingBox();

        if (boundingBox) {
          expect(boundingBox.width).toBeGreaterThanOrEqual(44); // WCAG AA
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }

        console.log(`✅ Viewport ${viewport.width}x${viewport.height} validation passed`);
      }
    });
  });
});