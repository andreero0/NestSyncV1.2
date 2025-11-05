const { chromium } = require('playwright');

async function testInventoryLayout() {
  console.log('🔍 Testing Inventory Status Cards Layout on iPhone 17 Pro');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false });

  // iPhone 17 Pro dimensions
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    console.log('\n✅ Step 1: Navigate to http://localhost:8082');
    await page.goto('http://localhost:8082', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Wait for page to stabilize

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-frontend/initial-load.png',
      fullPage: true
    });

    console.log('✅ Step 2: Checking for dashboard or login page');

    // Check if we're already on the dashboard (user might be logged in)
    const isDashboard = await page.locator('text=/Dashboard|Inventory|Status/i').first().isVisible().catch(() => false);

    if (!isDashboard) {
      console.log('   Not on dashboard, attempting login...');

      // Look for email input
      const emailInput = await page.locator('input[placeholder*="email" i], input[type="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill('parents@nestsync.com');

      // Look for password input
      const passwordInput = await page.locator('input[placeholder*="password" i], input[type="password"]').first();
      await passwordInput.fill('Shazam11#');

      // Wait a moment for form validation
      await page.waitForTimeout(1000);

      // Click sign in button
      const signInButton = await page.locator('button:has-text("Sign In"), button:has-text("Log In")').first();
      await signInButton.click();

      console.log('✅ Step 3: Wait for dashboard to load after login');

      // Wait for navigation and data loading
      await page.waitForTimeout(8000);

      // Check if we successfully logged in
      const loginError = await page.locator('text=/Unable to connect|error|failed/i').first().isVisible().catch(() => false);
      if (loginError) {
        console.error('❌ Login failed - network connectivity issue');
        await page.screenshot({
          path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-frontend/login-error.png',
          fullPage: true
        });
        throw new Error('Cannot test layout - login failed due to network issue');
      }
    } else {
      console.log('   Already on dashboard, skipping login');
    }

    console.log('\n✅ Step 4: Analyze inventory status cards layout');

    // Take screenshot of the dashboard
    await page.screenshot({
      path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-frontend/dashboard-iphone17pro.png',
      fullPage: true
    });

    // Try multiple selectors to find status cards
    console.log('   Looking for status cards with various selectors...');

    // Try to find cards by various methods
    let cards = await page.locator('div[role="button"]').all();
    console.log(`   Found ${cards.length} cards with role="button"`);

    if (cards.length === 0) {
      cards = await page.locator('[class*="card"]').all();
      console.log(`   Found ${cards.length} cards with class containing "card"`);
    }

    if (cards.length === 0) {
      cards = await page.locator('div').filter({ hasText: /Critical Items|Low Stock|Well Stocked|Pending Orders/i }).all();
      console.log(`   Found ${cards.length} cards by text content`);
    }

    console.log(`\nTotal cards found: ${cards.length}`);

    // Get card positions and dimensions
    const cardData = [];
    for (let i = 0; i < Math.min(cards.length, 4); i++) {
      const box = await cards[i].boundingBox();
      if (box) {
        cardData.push({
          index: i,
          x: Math.round(box.x),
          y: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height)
        });
      }
    }

    console.log('\n📊 Card Position Analysis:');
    console.log('=' .repeat(70));
    cardData.forEach(card => {
      console.log(`Card ${card.index}: Position (${card.x}, ${card.y}), Size ${card.width}x${card.height}`);
    });

    // Verify 2x2 grid layout
    console.log('\n🔍 Grid Layout Verification:');
    console.log('=' .repeat(70));

    if (cardData.length >= 4) {
      // Check if cards are in 2 columns
      const card0 = cardData[0];
      const card1 = cardData[1];
      const card2 = cardData[2];
      const card3 = cardData[3];

      const row1SameY = Math.abs(card0.y - card1.y) < 10;
      const row2SameY = Math.abs(card2.y - card3.y) < 10;
      const col1SameX = Math.abs(card0.x - card2.x) < 10;
      const col2SameX = Math.abs(card1.x - card3.x) < 10;
      const differentRows = Math.abs(card0.y - card2.y) > 50;

      console.log(`✓ Row 1 alignment (cards 0 & 1): ${row1SameY ? 'PASS' : 'FAIL'} (y-diff: ${Math.abs(card0.y - card1.y)}px)`);
      console.log(`✓ Row 2 alignment (cards 2 & 3): ${row2SameY ? 'PASS' : 'FAIL'} (y-diff: ${Math.abs(card2.y - card3.y)}px)`);
      console.log(`✓ Column 1 alignment (cards 0 & 2): ${col1SameX ? 'PASS' : 'FAIL'} (x-diff: ${Math.abs(card0.x - card2.x)}px)`);
      console.log(`✓ Column 2 alignment (cards 1 & 3): ${col2SameX ? 'PASS' : 'FAIL'} (x-diff: ${Math.abs(card1.x - card3.x)}px)`);
      console.log(`✓ Rows are separate: ${differentRows ? 'PASS' : 'FAIL'} (y-diff: ${Math.abs(card0.y - card2.y)}px)`);

      const isGridLayout = row1SameY && row2SameY && col1SameX && col2SameX && differentRows;

      console.log('\n' + '=' .repeat(70));
      if (isGridLayout) {
        console.log('✅ SUCCESS: Cards are arranged in proper 2x2 grid layout!');
      } else {
        console.log('❌ FAIL: Cards are NOT in 2x2 grid layout (stacking vertically)');
      }
      console.log('=' .repeat(70));

      // Calculate spacing
      const horizontalSpacing = card1.x - (card0.x + card0.width);
      const verticalSpacing = card2.y - (card0.y + card0.height);

      console.log(`\n📏 Spacing Measurements:`);
      console.log(`   Horizontal gap between cards: ${horizontalSpacing}px (expected: 16px)`);
      console.log(`   Vertical gap between rows: ${verticalSpacing}px (expected: 16px)`);

    } else {
      console.log('❌ FAIL: Less than 4 cards found on dashboard');
    }

    console.log('\n📸 Screenshot saved to: dashboard-iphone17pro.png');
    console.log('\n⏸️  Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    await page.screenshot({
      path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/NestSync-frontend/error-screenshot.png'
    });
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
  }
}

testInventoryLayout().catch(console.error);
