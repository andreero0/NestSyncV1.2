const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate and wait for app to load
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  // Take screenshot
  await page.screenshot({ path: 'grid-layout-fixed.png', fullPage: true });
  
  console.log('✅ Screenshot saved: grid-layout-fixed.png');
  
  await browser.close();
})();
