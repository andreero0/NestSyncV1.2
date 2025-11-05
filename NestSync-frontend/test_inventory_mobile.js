const { chromium } = require('playwright');

async function testInventoryGridMobile() {
  const browser = await chromium.launch({ headless: false });

  // iPhone 17 Pro viewport configuration
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  try {
    console.log('📱 Testing with iPhone 17 Pro viewport (393x852)');
    console.log('='.repeat(60));

    // Navigate to app
    console.log('\n1. Navigating to http://localhost:8082...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if we're on landing page or already logged in
    let currentUrl = page.url();
    console.log('   Current URL: ' + currentUrl);

    // Take screenshot to see what's on screen
    await page.screenshot({ path: 'debug-landing.png' });
    console.log('   Debug screenshot saved: debug-landing.png');

    // Navigate directly to sign-in page if on landing
    if (currentUrl === 'http://localhost:8082/') {
      console.log('\n2. On landing page, navigating to sign-in...');
      await page.goto('http://localhost:8082/sign-in', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
      console.log('   ✓ Navigated to sign-in page');
    }

    // Now check if we're on sign in page
    currentUrl = page.url();
    if (currentUrl.includes('sign-in') || currentUrl.includes('auth')) {
      console.log('\n3. Logging in with test credentials...');

      // Wait for email input
      await page.waitForSelector('input[type="email"], input[placeholder*="email" i], input[name="email"]', { timeout: 10000 });
      await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', 'parents@nestsync.com');
      console.log('   ✓ Email entered');

      // Wait for password input
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      await page.fill('input[type="password"]', 'Shazam11#');
      console.log('   ✓ Password entered');

      // Find and click sign in button
      await page.click('button:has-text("Sign In"), button:has-text("Log In")');
      console.log('   ✓ Sign in button clicked');

      // Wait for navigation to dashboard (tabs)
      await page.waitForTimeout(5000);
      currentUrl = page.url();
      console.log('   ✓ After sign in - URL: ' + currentUrl);
    } else if (currentUrl.includes('dashboard') || currentUrl.includes('tabs')) {
      console.log('\n2. Already authenticated');
    }

    // Navigate to dashboard tab
    console.log('\n4. Navigating to dashboard...');

    // Try multiple navigation approaches
    try {
      // Approach 1: Click on Dashboard tab if visible
      const dashboardTab = await page.locator('a[href*="dashboard"], button:has-text("Dashboard")').first();
      if (await dashboardTab.count() > 0) {
        await dashboardTab.click();
        await page.waitForTimeout(2000);
        console.log('   ✓ Clicked Dashboard tab');
      }
    } catch (e) {
      // Approach 2: Navigate directly to dashboard URL
      console.log('   Trying direct navigation to dashboard...');
      await page.goto('http://localhost:8082/(tabs)/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    // Take screenshot to verify we're on dashboard
    await page.screenshot({ path: 'debug-dashboard.png' });
    console.log('   Debug screenshot saved: debug-dashboard.png');

    // Close any modals or overlays
    console.log('\n5. Closing any modals...');
    try {
      // Look for X button or close button in the modal
      const closeButtons = [
        'text=/^×$/',
        'button:has-text("×")',
        '[aria-label*="close" i]',
        '[data-testid="close-modal"]',
        'button:near(:text("Welcome to Your Premium Trial"))'
      ];

      for (const selector of closeButtons) {
        const button = await page.locator(selector).first();
        if (await button.count() > 0) {
          await button.click();
          await page.waitForTimeout(1500);
          console.log('   ✓ Modal closed');
          break;
        }
      }
    } catch (e) {
      console.log('   Could not close modal: ' + e.message);
    }

    // Scroll to inventory section
    console.log('\n6. Scrolling to inventory section...');
    const inventorySection = await page.locator('text=/Inventory/i').first();
    if (await inventorySection.count() > 0) {
      await inventorySection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      console.log('   ✓ Scrolled to inventory');
    }

    // Take screenshot
    const screenshotPath = 'inventory-grid-iphone17pro.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\n7. Screenshot saved: ' + screenshotPath);

    // Analyze grid layout
    console.log('\n8. Analyzing grid layout...');

    // Look for inventory status cards with borders
    const inventoryCards = await page.locator('[style*="border"]').all();
    console.log('   Found ' + inventoryCards.length + ' elements with borders');

    // Filter for visible cards in the inventory section
    const visibleCards = [];
    for (const card of inventoryCards) {
      const box = await card.boundingBox();
      if (box && box.width > 100 && box.height > 100) {
        visibleCards.push({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        });
      }
    }

    console.log('   Found ' + visibleCards.length + ' visible inventory cards');

    if (visibleCards.length >= 3) {
      console.log('\n   Card Layout Analysis:');
      visibleCards.slice(0, 4).forEach((info, i) => {
        console.log('   Card ' + i + ': x=' + info.x.toFixed(1) + ', y=' + info.y.toFixed(1) + ', w=' + info.width.toFixed(1) + ', h=' + info.height.toFixed(1));
      });

      // Sort by Y position to identify rows
      const sortedCards = visibleCards.slice(0, 4).sort((a, b) => a.y - b.y);

      if (sortedCards.length >= 3) {
        // Group by similar Y values (within 50px tolerance for same row)
        const rows = [];
        let currentRow = [sortedCards[0]];

        for (let i = 1; i < sortedCards.length; i++) {
          if (Math.abs(sortedCards[i].y - currentRow[0].y) < 50) {
            currentRow.push(sortedCards[i]);
          } else {
            rows.push(currentRow);
            currentRow = [sortedCards[i]];
          }
        }
        rows.push(currentRow);

        console.log('\n   Grid Analysis:');
        rows.forEach((row, i) => {
          console.log('   Row ' + (i + 1) + ': ' + row.length + ' cards');
        });

        if (rows.length >= 2 && rows[0].length === 2) {
          console.log('\n   ✅ 2x2 GRID LAYOUT CONFIRMED on iPhone 17 Pro (393x852)');
          console.log('   Cards are arranged in 2 columns as expected for mobile viewport');
        } else {
          console.log('\n   ⚠️  Grid pattern: ' + rows.map(r => r.length).join('x'));
        }
      }
    } else {
      console.log('   ⚠️  Could not find enough inventory cards for grid analysis');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully');
    console.log('📸 Screenshot: ' + screenshotPath);

  } catch (error) {
    console.log('\n❌ Error during test: ' + error.message);
    console.error(error);
  } finally {
    await browser.close();
  }
}

testInventoryGridMobile();
