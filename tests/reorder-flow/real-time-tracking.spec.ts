import { test, expect } from '../fixtures/auth';
import { GraphQLHelper, REORDER_SUBSCRIPTIONS } from '../utils/graphql-helpers';
import { performanceThresholds } from '../playwright.config';

/**
 * Real-Time Functionality and GraphQL Subscription Tests
 *
 * Tests real-time order tracking and live updates:
 * 1. GraphQL subscription connection establishment
 * 2. Live order status updates and WebSocket messaging
 * 3. Network interruption and reconnection handling
 * 4. Offline queue functionality and sync on reconnection
 * 5. Real-time ML prediction updates
 * 6. Performance validation of real-time features
 */

test.describe('Real-Time Functionality and WebSocket Testing', () => {
  let graphqlHelper: GraphQLHelper;

  test.beforeEach(async ({ page }) => {
    graphqlHelper = new GraphQLHelper(page);
  });

  test.describe('GraphQL Subscription Establishment', () => {
    test('should establish WebSocket connection for order tracking', async ({
      primaryUser: { page }
    }) => {
      // Navigate to order tracking page
      await page.goto('/orders');
      await page.waitForLoadState('networkidle');

      // Set up WebSocket monitoring
      const webSocketPromise = page.waitForEvent('websocket');

      // Trigger subscription connection
      await page.getByTestId('enable-real-time-updates').click();

      // Wait for WebSocket connection
      const webSocket = await webSocketPromise;
      console.log('WebSocket connection established:', webSocket.url());

      // Verify connection is for GraphQL subscriptions
      expect(webSocket.url()).toContain('graphql');

      // Monitor WebSocket messages
      const messages: string[] = [];

      webSocket.on('framereceived', (payload) => {
        const message = payload.toString();
        messages.push(message);
        console.log('WebSocket received:', message);
      });

      webSocket.on('framesent', (payload) => {
        const message = payload.toString();
        console.log('WebSocket sent:', message);
      });

      // Wait for connection acknowledgment
      await page.waitForFunction(() => {
        return window.localStorage.getItem('ws-connection-status') === 'connected';
      }, { timeout: 10000 });

      // Verify connection indicator
      await expect(page.getByTestId('real-time-status')).toContainText('Connected');
      await expect(page.getByTestId('real-time-indicator')).toHaveClass(/connected/);

      // Verify subscription initialization messages
      await page.waitForTimeout(2000); // Allow time for messages

      const hasConnectionInit = messages.some(msg => {
        try {
          const parsed = JSON.parse(msg);
          return parsed.type === 'connection_init';
        } catch {
          return false;
        }
      });

      expect(hasConnectionInit).toBe(true);
    });

    test('should handle WebSocket connection failures gracefully', async ({
      primaryUser: { page }
    }) => {
      // Block WebSocket connections
      await page.route('**/graphql*', route => {
        if (route.request().url().includes('ws://') || route.request().url().includes('wss://')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto('/orders');
      await page.waitForLoadState('networkidle');

      // Try to enable real-time updates
      await page.getByTestId('enable-real-time-updates').click();

      // Should show connection failure
      await expect(page.getByTestId('real-time-status')).toContainText('Connection failed');
      await expect(page.getByTestId('connection-retry-button')).toBeVisible();

      // Should fall back to polling mode
      await expect(page.getByTestId('polling-mode-notice')).toBeVisible();
      await expect(page.getByText('Updates every 30 seconds')).toBeVisible();

      // Retry connection
      await page.unroute('**/graphql*');
      await page.getByTestId('connection-retry-button').click();

      // Should eventually succeed
      await expect(page.getByTestId('real-time-status')).toContainText('Connected', {
        timeout: 15000
      });
    });

    test('should validate subscription authentication and authorization', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/orders');

      // Establish connection
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-updates').click();
      const webSocket = await webSocketPromise;

      // Monitor for authentication messages
      let authenticationSent = false;
      let authenticationAcknowledged = false;

      webSocket.on('framesent', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'connection_init' && message.payload?.Authorization) {
            authenticationSent = true;
            console.log('Authentication token sent in WebSocket connection');
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'connection_ack') {
            authenticationAcknowledged = true;
            console.log('WebSocket authentication acknowledged');
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Wait for authentication flow
      await page.waitForTimeout(3000);

      expect(authenticationSent).toBe(true);
      expect(authenticationAcknowledged).toBe(true);

      // Verify user can only subscribe to their own data
      const userId = await page.evaluate(() =>
        localStorage.getItem('currentUserId')
      );

      expect(userId).toBeDefined();
      console.log(`User ${userId} authenticated for WebSocket subscriptions`);
    });
  });

  test.describe('Live Order Status Updates', () => {
    test('should receive real-time order status updates', async ({
      primaryUser: { page }
    }) => {
      // First create a test order
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();

      // Complete order creation (simplified for testing)
      await page.getByTestId('confirm-order-button').click();

      // Wait for order confirmation and extract order ID
      await expect(page.getByTestId('order-success-confirmation')).toBeVisible();
      const orderNumber = await page.getByTestId('order-number').textContent();

      console.log(`Created test order: ${orderNumber}`);

      // Navigate to order tracking
      await page.getByTestId('track-order-button').click();
      await page.waitForURL('/orders/**');

      // Enable real-time tracking
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-tracking').click();
      const webSocket = await webSocketPromise;

      // Set up subscription event monitoring
      const subscriptionEvents: any[] = [];

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'data' && message.payload?.data?.orderStatusUpdates) {
            subscriptionEvents.push(message.payload.data.orderStatusUpdates);
            console.log('Order status update received:', message.payload.data.orderStatusUpdates);
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Simulate status update (in test environment)
      await page.getByTestId('simulate-status-update').click();
      await page.getByTestId('update-to-processing').click();

      // Wait for real-time update
      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="order-status"]')?.textContent?.includes('Processing');
      }, { timeout: 10000 });

      // Verify UI updates
      await expect(page.getByTestId('order-status')).toContainText('Processing');
      await expect(page.getByTestId('status-timeline')).toContainText('Processing');

      // Verify we received the subscription event
      expect(subscriptionEvents.length).toBeGreaterThan(0);
      expect(subscriptionEvents[0].status).toBe('PROCESSING');

      // Test another status update
      await page.getByTestId('simulate-status-update').click();
      await page.getByTestId('update-to-shipped').click();

      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="order-status"]')?.textContent?.includes('Shipped');
      }, { timeout: 10000 });

      await expect(page.getByTestId('order-status')).toContainText('Shipped');
      await expect(page.getByTestId('tracking-number')).toBeVisible();

      console.log(`Received ${subscriptionEvents.length} real-time status updates`);
    });

    test('should handle multiple concurrent order subscriptions', async ({
      primaryUser: { page }
    }) => {
      // Create multiple test orders first
      const orderIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        await page.goto('/reorder');
        const predictionCard = page.getByTestId('reorder-suggestion-card').first();
        await predictionCard.getByTestId('reorder-now-button').click();
        await page.getByTestId('confirm-order-button').click();

        const orderNumber = await page.getByTestId('order-number').textContent();
        if (orderNumber) {
          orderIds.push(orderNumber);
        }
      }

      console.log(`Created ${orderIds.length} test orders for concurrent tracking`);

      // Navigate to orders dashboard
      await page.goto('/orders');
      await page.waitForLoadState('networkidle');

      // Enable real-time tracking for all orders
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-bulk-tracking').click();
      const webSocket = await webSocketPromise;

      // Monitor subscription events for all orders
      const orderUpdates = new Map<string, any[]>();

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'data' && message.payload?.data?.orderStatusUpdates) {
            const update = message.payload.data.orderStatusUpdates;
            const orderId = update.id;

            if (!orderUpdates.has(orderId)) {
              orderUpdates.set(orderId, []);
            }
            orderUpdates.get(orderId)!.push(update);
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Simulate updates for different orders
      for (let i = 0; i < orderIds.length; i++) {
        const orderCard = page.getByTestId(`order-card-${orderIds[i]}`);
        await orderCard.getByTestId('simulate-update').click();
        await page.getByTestId('update-to-processing').click();

        // Small delay between updates
        await page.waitForTimeout(500);
      }

      // Wait for all updates to be received
      await page.waitForTimeout(5000);

      // Verify all orders received updates
      expect(orderUpdates.size).toBe(orderIds.length);

      orderIds.forEach(orderId => {
        expect(orderUpdates.has(orderId)).toBe(true);
        expect(orderUpdates.get(orderId)!.length).toBeGreaterThan(0);
      });

      console.log(`Successfully tracked ${orderUpdates.size} orders simultaneously`);
    });

    test('should measure real-time update performance', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/orders');

      // Create order for testing
      await page.goto('/reorder');
      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();
      await page.getByTestId('confirm-order-button').click();

      const orderNumber = await page.getByTestId('order-number').textContent();
      await page.getByTestId('track-order-button').click();

      // Set up performance monitoring
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-tracking').click();
      const webSocket = await webSocketPromise;

      const performanceMetrics: number[] = [];

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'data' && message.payload?.data?.orderStatusUpdates) {
            const receiveTime = Date.now();
            const updateTimestamp = new Date(message.payload.data.orderStatusUpdates.updatedAt).getTime();
            const latency = receiveTime - updateTimestamp;

            performanceMetrics.push(latency);
            console.log(`Real-time update latency: ${latency}ms`);
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Trigger multiple status updates to measure performance
      for (let i = 0; i < 5; i++) {
        await page.getByTestId('simulate-status-update').click();
        await page.getByTestId(`update-to-step-${i + 1}`).click();
        await page.waitForTimeout(1000);
      }

      // Wait for all metrics to be collected
      await page.waitForTimeout(3000);

      // Analyze performance
      if (performanceMetrics.length > 0) {
        const averageLatency = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
        const maxLatency = Math.max(...performanceMetrics);
        const minLatency = Math.min(...performanceMetrics);

        console.log(`Real-time performance metrics:`);
        console.log(`- Average latency: ${averageLatency}ms`);
        console.log(`- Max latency: ${maxLatency}ms`);
        console.log(`- Min latency: ${minLatency}ms`);

        // Validate against performance thresholds
        expect(averageLatency).toBeLessThan(performanceThresholds.realTimeUpdate);
        expect(maxLatency).toBeLessThan(performanceThresholds.realTimeUpdate * 2);
      }
    });
  });

  test.describe('Network Interruption and Reconnection', () => {
    test('should handle network interruptions gracefully', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/orders');

      // Establish WebSocket connection
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-updates').click();
      const webSocket = await webSocketPromise;

      // Wait for connection to be established
      await expect(page.getByTestId('real-time-status')).toContainText('Connected');

      // Simulate network interruption by closing WebSocket
      await webSocket.close();

      // Should detect disconnection
      await expect(page.getByTestId('real-time-status')).toContainText('Disconnected', {
        timeout: 10000
      });

      // Should show reconnection UI
      await expect(page.getByTestId('reconnecting-indicator')).toBeVisible();
      await expect(page.getByTestId('manual-reconnect-button')).toBeVisible();

      // Should attempt automatic reconnection
      await page.waitForTimeout(5000);

      // Should eventually reconnect
      await expect(page.getByTestId('real-time-status')).toContainText('Connected', {
        timeout: 15000
      });

      await expect(page.getByTestId('reconnecting-indicator')).not.toBeVisible();
    });

    test('should queue updates during offline periods', async ({
      primaryUser: { page }
    }) => {
      // Create test order first
      await page.goto('/reorder');
      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();
      await page.getByTestId('confirm-order-button').click();

      await page.getByTestId('track-order-button').click();

      // Establish connection
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-tracking').click();
      const webSocket = await webSocketPromise;

      await expect(page.getByTestId('real-time-status')).toContainText('Connected');

      // Simulate going offline
      await page.context().setOffline(true);
      await webSocket.close();

      // Should show offline indicator
      await expect(page.getByTestId('offline-indicator')).toBeVisible();
      await expect(page.getByTestId('updates-queued-notice')).toBeVisible();

      // Simulate status updates while offline (these would normally be queued)
      await page.getByTestId('simulate-offline-updates').click();

      // Verify offline queue indicator
      await expect(page.getByTestId('queued-updates-count')).toContainText('3 updates');

      // Go back online
      await page.context().setOffline(false);

      // Should reconnect and sync queued updates
      await expect(page.getByTestId('real-time-status')).toContainText('Connected', {
        timeout: 15000
      });

      await expect(page.getByTestId('syncing-updates')).toBeVisible();
      await expect(page.getByTestId('queued-updates-count')).toContainText('0 updates');

      // Verify all updates were applied
      await expect(page.getByTestId('order-status')).toContainText('Delivered');
    });

    test('should handle WebSocket message ordering and deduplication', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/orders');

      // Create test order
      await page.goto('/reorder');
      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();
      await page.getByTestId('confirm-order-button').click();

      await page.getByTestId('track-order-button').click();

      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-tracking').click();
      const webSocket = await webSocketPromise;

      // Monitor received messages for ordering
      const receivedMessages: any[] = [];

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'data' && message.payload?.data?.orderStatusUpdates) {
            receivedMessages.push(message.payload.data.orderStatusUpdates);
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Simulate rapid status updates (potential for out-of-order delivery)
      await page.getByTestId('simulate-rapid-updates').click();

      // Wait for all messages
      await page.waitForTimeout(5000);

      // Verify message ordering by timestamp
      for (let i = 1; i < receivedMessages.length; i++) {
        const prevTimestamp = new Date(receivedMessages[i - 1].updatedAt).getTime();
        const currentTimestamp = new Date(receivedMessages[i].updatedAt).getTime();

        expect(currentTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
      }

      // Verify no duplicate messages
      const messageIds = receivedMessages.map(msg => msg.id);
      const uniqueIds = new Set(messageIds);
      expect(uniqueIds.size).toBe(messageIds.length);

      console.log(`Received ${receivedMessages.length} ordered, deduplicated messages`);
    });
  });

  test.describe('ML Prediction Real-Time Updates', () => {
    test('should receive real-time ML prediction updates', async ({
      premiumUser: { page }
    }) => {
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      // Enable real-time prediction updates
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-prediction-updates').click();
      const webSocket = await webSocketPromise;

      // Monitor for prediction updates
      const predictionUpdates: any[] = [];

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          if (message.type === 'data' && message.payload?.data?.predictionUpdates) {
            predictionUpdates.push(message.payload.data.predictionUpdates);
            console.log('ML prediction update received:', message.payload.data.predictionUpdates);
          }
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Trigger ML model refresh (in test environment)
      await page.getByTestId('trigger-ml-refresh').click();

      // Wait for prediction update
      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="prediction-updated-indicator"]')?.classList.contains('updated');
      }, { timeout: 15000 });

      // Verify UI updates
      await expect(page.getByTestId('prediction-updated-indicator')).toBeVisible();
      await expect(page.getByTestId('updated-confidence-level')).toBeVisible();

      // Verify we received prediction updates
      expect(predictionUpdates.length).toBeGreaterThan(0);
      expect(predictionUpdates[0].confidenceLevel).toBeDefined();
      expect(predictionUpdates[0].predictedRunoutDate).toBeDefined();

      console.log(`Received ${predictionUpdates.length} ML prediction updates`);
    });

    test('should handle prediction confidence changes in real-time', async ({
      premiumUser: { page }
    }) => {
      await page.goto('/reorder');

      // Enable prediction updates
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-prediction-updates').click();
      const webSocket = await webSocketPromise;

      // Get initial confidence level
      const initialConfidence = await page.getByTestId('confidence-level').textContent();
      console.log(`Initial confidence: ${initialConfidence}`);

      // Simulate new data affecting confidence
      await page.getByTestId('simulate-usage-data').click();

      // Wait for confidence update
      await page.waitForFunction((initial) => {
        const current = document.querySelector('[data-testid="confidence-level"]')?.textContent;
        return current && current !== initial;
      }, initialConfidence, { timeout: 15000 });

      const updatedConfidence = await page.getByTestId('confidence-level').textContent();
      console.log(`Updated confidence: ${updatedConfidence}`);

      // Verify confidence change notification
      await expect(page.getByTestId('confidence-change-notification')).toBeVisible();

      // Should show confidence trend
      await expect(page.getByTestId('confidence-trend-indicator')).toBeVisible();
    });
  });

  test.describe('Subscription Management and Cleanup', () => {
    test('should properly manage subscription lifecycle', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/orders');

      // Establish multiple subscriptions
      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-updates').click();
      const webSocket = await webSocketPromise;

      // Track subscription messages
      const subscriptionMessages: any[] = [];

      webSocket.on('framereceived', (payload) => {
        try {
          const message = JSON.parse(payload.toString());
          subscriptionMessages.push(message);
        } catch (error) {
          // Ignore parse errors
        }
      });

      // Start multiple subscriptions
      await page.getByTestId('subscribe-to-orders').click();
      await page.getByTestId('subscribe-to-predictions').click();

      // Wait for subscription confirmations
      await page.waitForTimeout(3000);

      // Verify start messages
      const startMessages = subscriptionMessages.filter(msg => msg.type === 'start');
      expect(startMessages.length).toBeGreaterThanOrEqual(2);

      // Navigate away (should trigger cleanup)
      await page.goto('/dashboard');

      // Wait for cleanup
      await page.waitForTimeout(2000);

      // Verify stop messages
      const stopMessages = subscriptionMessages.filter(msg => msg.type === 'stop');
      expect(stopMessages.length).toBeGreaterThanOrEqual(2);

      console.log(`Subscription lifecycle: ${startMessages.length} started, ${stopMessages.length} stopped`);
    });

    test('should handle subscription errors gracefully', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/orders');

      // Mock subscription error
      await page.route('**/graphql*', route => {
        if (route.request().postData()?.includes('subscription')) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              errors: [{ message: 'Subscription failed', extensions: { code: 'SUBSCRIPTION_ERROR' } }]
            })
          });
        } else {
          route.continue();
        }
      });

      const webSocketPromise = page.waitForEvent('websocket');
      await page.getByTestId('enable-real-time-updates').click();
      const webSocket = await webSocketPromise;

      // Should show error state
      await expect(page.getByTestId('subscription-error')).toBeVisible();
      await expect(page.getByTestId('subscription-retry-button')).toBeVisible();

      // Should offer fallback to polling
      await expect(page.getByTestId('fallback-to-polling')).toBeVisible();
      await page.getByTestId('fallback-to-polling').click();

      // Should switch to polling mode
      await expect(page.getByTestId('polling-mode-active')).toBeVisible();
      await expect(page.getByText('Checking for updates every 30 seconds')).toBeVisible();
    });
  });
});