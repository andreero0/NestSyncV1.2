const { chromium } = require('playwright');
const path = require('path');

async function testHTMLGrid() {
  console.log('🔍 Testing Pure CSS Grid Layout on iPhone 17 Pro');
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
    const htmlPath = path.join(__dirname, 'simple-layout-test.html');
    console.log(`\n✅ Loading HTML file: file://${htmlPath}`);

    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(__dirname, 'html-grid-test.png'),
      fullPage: true
    });

    console.log('\n📊 Reading layout measurements from page...\n');

    // Get the verification results from the page
    const verificationText = await page.locator('#verification').textContent();
    console.log(verificationText);

    console.log('\n📸 Screenshot saved to: html-grid-test.png');
    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete\n');
  }
}

testHTMLGrid().catch(console.error);
