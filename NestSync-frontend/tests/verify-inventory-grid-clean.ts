/**
 * Clean Inventory Grid Verification Script - Without Modal Overlays
 */

import { chromium } from 'playwright';

async function verifyInventoryGridClean() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Navigating and logging in...');
    await page.goto('http://localhost:8082');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
    await page.fill('input[type="email"]', 'parents@nestsync.com');

    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill('Shazam11#');
    }

    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();

    await page.waitForTimeout(5000);

    console.log('2. Closing any modal overlays...');
    // Try to close the premium trial modal if it appears
    const closeButton = page.locator('button:has-text("✕"), button[aria-label="Close"]').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }

    console.log('3. Taking clean screenshot of inventory cards...');
    await page.screenshot({ path: 'test-results/inventory-grid-clean-view.png', fullPage: true });

    // Get the inventory status section
    const inventorySection = page.locator('text=Inventory Status').locator('..');
    if (await inventorySection.isVisible().catch(() => false)) {
      const sectionBox = await inventorySection.boundingBox();
      if (sectionBox) {
        await page.screenshot({
          path: 'test-results/inventory-grid-section-only.png',
          clip: {
            x: sectionBox.x - 20,
            y: sectionBox.y - 20,
            width: Math.min(sectionBox.width + 40, page.viewportSize()!.width),
            height: Math.min(sectionBox.height + 200, 400)
          }
        });
      }
    }

    console.log('4. Analyzing grid layout...');
    const cards = [
      { name: 'Critical Items', locator: page.locator('text=Critical Items').first() },
      { name: 'Low Stock', locator: page.locator('text=Low Stock').first() },
      { name: 'Well Stocked', locator: page.locator('text=Well Stocked').first() },
      { name: 'Pending Orders', locator: page.locator('text=Pending Orders').first() }
    ];

    console.log('\n=== INVENTORY CARD GRID LAYOUT VERIFICATION ===\n');

    const positions = [];
    for (const card of cards) {
      const box = await card.locator.boundingBox();
      if (box) {
        positions.push({ name: card.name, box });
        console.log(`${card.name}:`);
        console.log(`  Position: (${Math.round(box.x)}, ${Math.round(box.y)})`);
        console.log(`  Size: ${Math.round(box.width)}px × ${Math.round(box.height)}px`);
      }
    }

    if (positions.length === 4) {
      // Check for 2x2 grid layout
      const [critical, lowStock, wellStocked, pending] = positions;

      const row1Y = Math.min(critical.box.y, lowStock.box.y);
      const row2Y = Math.min(wellStocked.box.y, pending.box.y);

      const row1Aligned = Math.abs(critical.box.y - lowStock.box.y) < 10;
      const row2Aligned = Math.abs(wellStocked.box.y - pending.box.y) < 10;
      const hasTwoRows = Math.abs(row1Y - row2Y) > 100;

      const col1X = Math.min(critical.box.x, wellStocked.box.x);
      const col2X = Math.min(lowStock.box.x, pending.box.x);
      const hasTwoColumns = Math.abs(col1X - col2X) > 100;

      console.log('\n--- Grid Layout Analysis ---');
      console.log(`Row 1 alignment (Critical Items & Low Stock): ${row1Aligned ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Row 2 alignment (Well Stocked & Pending Orders): ${row2Aligned ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Two distinct rows: ${hasTwoRows ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`Two distinct columns: ${hasTwoColumns ? '✅ PASS' : '❌ FAIL'}`);

      const spacing = Math.round(Math.abs(col2X - col1X - critical.box.width));
      console.log(`\nHorizontal spacing between cards: ~${spacing}px`);

      if (row1Aligned && row2Aligned && hasTwoRows && hasTwoColumns) {
        console.log('\n✅ VERIFICATION RESULT: PASSED');
        console.log('Inventory cards are correctly displayed in a 2x2 grid layout.');
        console.log('The layout fix (justifyContent: flex-start) is working as expected.');
      } else {
        console.log('\n❌ VERIFICATION RESULT: FAILED');
        console.log('Cards are NOT in a proper 2x2 grid. They may be stacked vertically.');
      }
    }

  } catch (error) {
    console.error('Error during verification:', error);
    await page.screenshot({ path: 'test-results/inventory-grid-error.png', fullPage: true });
  } finally {
    console.log('\n5. Closing browser...');
    await browser.close();
    console.log('\nScreenshots saved to test-results/ folder:');
    console.log('  - inventory-grid-clean-view.png (full dashboard)');
    console.log('  - inventory-grid-section-only.png (inventory section only)');
  }
}

verifyInventoryGridClean().catch(console.error);
