/**
 * Manual Inventory Grid Verification Script
 *
 * This script uses Playwright to:
 * 1. Navigate to the app
 * 2. Login with test credentials
 * 3. Take a screenshot of the dashboard showing inventory cards
 * 4. Report findings
 *
 * Run with: npx tsx tests/verify-inventory-grid-manual.ts
 */

import { chromium } from 'playwright';

async function verifyInventoryGrid() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:8082');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('2. Taking initial screenshot...');
    await page.screenshot({ path: 'test-results/manual-01-initial-screen.png', fullPage: true });

    console.log('3. Filling in login credentials...');

    // Wait for email input to be visible
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[type="email"]', 'parents@nestsync.com');

    // Fill password
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill('Shazam11#');
    }

    await page.screenshot({ path: 'test-results/manual-02-credentials-filled.png', fullPage: true });

    console.log('4. Clicking Sign In button...');
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();

    console.log('5. Waiting for navigation...');
    // Wait for either dashboard or error message
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/manual-03-after-signin-attempt.png', fullPage: true });

    console.log('6. Checking current page state...');
    const pageText = await page.locator('body').textContent();
    console.log('Page content preview:', pageText?.substring(0, 300));

    // Look for specific inventory card text
    const criticalItemsVisible = await page.locator('text=Critical Items').isVisible().catch(() => false);
    const lowStockVisible = await page.locator('text=Low Stock').isVisible().catch(() => false);
    const wellStockedVisible = await page.locator('text=Well Stocked').isVisible().catch(() => false);
    const pendingOrdersVisible = await page.locator('text=Pending Orders').isVisible().catch(() => false);

    console.log('\n=== INVENTORY CARD VISIBILITY ===');
    console.log('Critical Items:', criticalItemsVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE');
    console.log('Low Stock:', lowStockVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE');
    console.log('Well Stocked:', wellStockedVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE');
    console.log('Pending Orders:', pendingOrdersVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE');

    const visibleCount = [criticalItemsVisible, lowStockVisible, wellStockedVisible, pendingOrdersVisible].filter(Boolean).length;
    console.log(`\nTotal visible cards: ${visibleCount} / 4`);

    if (visibleCount === 4) {
      console.log('\n✓ SUCCESS: All inventory cards are visible!');
      console.log('Now checking layout...');

      // Get bounding boxes to verify grid layout
      const criticalBox = await page.locator('text=Critical Items').first().boundingBox();
      const lowStockBox = await page.locator('text=Low Stock').first().boundingBox();
      const wellStockedBox = await page.locator('text=Well Stocked').first().boundingBox();
      const pendingBox = await page.locator('text=Pending Orders').first().boundingBox();

      console.log('\n=== CARD POSITIONS ===');
      console.log('Critical Items:', criticalBox);
      console.log('Low Stock:', lowStockBox);
      console.log('Well Stocked:', wellStockedBox);
      console.log('Pending Orders:', pendingBox);

      // Check if cards are in 2x2 grid (2 columns)
      // Cards should have similar y-coordinates for same row
      if (criticalBox && lowStockBox && wellStockedBox && pendingBox) {
        const row1Y = Math.min(criticalBox.y, lowStockBox.y);
        const row2Y = Math.min(wellStockedBox.y, pendingBox.y);

        const isRow1Aligned = Math.abs(criticalBox.y - lowStockBox.y) < 10;
        const isRow2Aligned = Math.abs(wellStockedBox.y - pendingBox.y) < 10;
        const hasTwoRows = Math.abs(row1Y - row2Y) > 100;

        console.log('\n=== GRID LAYOUT ANALYSIS ===');
        console.log('Row 1 aligned (Critical Items & Low Stock):', isRow1Aligned ? '✓ YES' : '✗ NO');
        console.log('Row 2 aligned (Well Stocked & Pending Orders):', isRow2Aligned ? '✓ YES' : '✗ NO');
        console.log('Two distinct rows:', hasTwoRows ? '✓ YES' : '✗ NO');

        if (isRow1Aligned && isRow2Aligned && hasTwoRows) {
          console.log('\n✅ VERIFIED: Cards are displayed in a proper 2x2 grid layout!');
        } else {
          console.log('\n⚠️  WARNING: Cards may be stacked vertically instead of 2x2 grid');
        }
      }

      await page.screenshot({ path: 'test-results/manual-04-final-dashboard-with-cards.png', fullPage: true });
    } else {
      console.log('\n✗ FAILED: Not all inventory cards are visible');
      console.log('This might mean:');
      console.log('- Login failed to complete');
      console.log('- Dashboard not fully loaded');
      console.log('- Need to navigate to specific tab');
    }

  } catch (error) {
    console.error('Error during verification:', error);
    await page.screenshot({ path: 'test-results/manual-error-screenshot.png', fullPage: true });
  } finally {
    console.log('\n7. Closing browser...');
    await browser.close();
    console.log('Done! Check test-results/ folder for screenshots.');
  }
}

verifyInventoryGrid().catch(console.error);
