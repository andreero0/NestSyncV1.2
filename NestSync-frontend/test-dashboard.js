const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    console.log('2. Filling in credentials...');
    const emailInput = await page.locator('input[placeholder*="email"], input[type="email"]').first();
    await emailInput.fill('parents@nestsync.com');
    
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('Shazam11#');
    
    console.log('3. Clicking Sign In button...');
    await page.click('text=Sign In');
    
    console.log('4. Waiting for dashboard to load...');
    // Wait for either the dashboard heading or inventory status to appear
    await page.waitForSelector('text=Inventory Status', { timeout: 15000 }).catch(() => 
      page.waitForSelector('text=Critical Items', { timeout: 5000 })
    );
    
    console.log('5. Taking screenshot...');
    await page.screenshot({ path: 'dashboard-with-grid.png', fullPage: true });
    
    console.log('✅ Dashboard screenshot saved!');
    
    // Keep browser open for 3 seconds so you can see it
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  await browser.close();
})();
