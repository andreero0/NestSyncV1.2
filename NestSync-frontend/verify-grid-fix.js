const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to app...');
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('Logging in...');
  await page.fill('input[placeholder*="email"]', 'parents@nestsync.com');
  await page.fill('input[type="password"]', 'Shazam11#');
  await page.click('text=Sign In');
  
  console.log('Waiting for dashboard to load...');
  await page.waitForTimeout(8000);
  
  console.log('Taking dashboard screenshot...');
  await page.screenshot({ path: 'dashboard-grid-verified.png', fullPage: true });
  
  console.log('✅ Dashboard screenshot saved: dashboard-grid-verified.png');
  
  await browser.close();
})();
