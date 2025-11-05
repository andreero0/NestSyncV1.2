const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'expo-sdk54-validated.png', fullPage: true });
  
  console.log('✅ Screenshot saved: expo-sdk54-validated.png');
  console.log('✅ Page title:', await page.title());
  
  await browser.close();
})();
