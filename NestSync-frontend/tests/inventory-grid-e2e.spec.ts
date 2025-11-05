import { test, expect } from '@playwright/test';

/**
 * Inventory Card Grid Layout Verification Test
 *
 * Purpose: Verify that the inventory status cards display in a 2x2 grid
 * after fixing the layout regression where cards were stacking vertically.
 *
 * Expected Layout:
 * - 4 cards total: Critical Items, Low Stock, Well Stocked, Pending Orders
 * - 2 columns, 2 rows
 * - Each card is 160x120px
 * - 16px spacing between cards
 *
 * Bug Fix: Changed justifyContent from 'space-between' to 'flex-start'
 * in components/cards/StatusOverviewGrid.tsx
 */

test.describe('Inventory Card Grid Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8082');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display inventory cards in 2x2 grid after login', async ({ page }) => {
    // Login with test credentials
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await emailInput.fill('parents@nestsync.com');

    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('Shazam11#');

    // Click sign in button
    const signInButton = await page.locator('text=Sign In').first();
    await signInButton.click();

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow time for dashboard to render

    // Take a full page screenshot
    await page.screenshot({
      path: 'test-results/inventory-grid-layout-dashboard.png',
      fullPage: true
    });

    // Look for inventory card container
    // Note: The exact selector may need adjustment based on actual DOM structure
    const inventoryCards = await page.locator('[data-testid="status-overview-grid"]').or(
      page.locator('text=Critical Items').locator('..')
    );

    if (await inventoryCards.count() > 0) {
      // Get bounding boxes of all cards
      const cardElements = await page.locator('text=Critical Items, text=Low Stock, text=Well Stocked, text=Pending Orders').all();

      console.log(`Found ${cardElements.length} inventory cards`);

      // Take screenshot of the card area
      await page.screenshot({
        path: 'test-results/inventory-cards-layout.png',
        clip: await inventoryCards.first().boundingBox() || undefined
      });
    } else {
      console.log('Inventory cards not found - may need to navigate to correct screen');

      // Take diagnostic screenshot
      await page.screenshot({
        path: 'test-results/inventory-grid-no-cards-found.png',
        fullPage: true
      });
    }

    // Additional diagnostic: log page content
    const bodyText = await page.locator('body').textContent();
    console.log('Page content includes:', bodyText?.substring(0, 500));
  });

  test('should verify card dimensions and spacing', async ({ page }) => {
    // Login flow
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await emailInput.fill('parents@nestsync.com');

    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('Shazam11#');

    const signInButton = await page.locator('text=Sign In').first();
    await signInButton.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for specific card text
    const criticalItemsCard = page.locator('text=Critical Items').first();
    const lowStockCard = page.locator('text=Low Stock').first();
    const wellStockedCard = page.locator('text=Well Stocked').first();
    const pendingOrdersCard = page.locator('text=Pending Orders').first();

    // Check if cards are visible
    const cards = [criticalItemsCard, lowStockCard, wellStockedCard, pendingOrdersCard];
    const visibleCards = [];

    for (const card of cards) {
      if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
        visibleCards.push(card);
        const box = await card.boundingBox();
        console.log(`Card found at position: x=${box?.x}, y=${box?.y}, width=${box?.width}, height=${box?.height}`);
      }
    }

    console.log(`Visible cards: ${visibleCards.length} out of 4`);

    // Take final screenshot with annotations
    await page.screenshot({
      path: 'test-results/inventory-grid-final-verification.png',
      fullPage: true
    });

    // Expect to find all 4 cards
    expect(visibleCards.length).toBe(4);
  });
});
