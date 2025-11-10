/**
 * Design System Audit - Inconsistent Screen Capture
 * 
 * This script captures screenshots of screens that exhibit design inconsistencies
 * (premium upgrade flow, reorder flow, size predictions, payment screens).
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:19006';
const SCREENSHOT_DIR = path.join(__dirname, '../../.kiro/specs/design-consistency-fix/audit-screenshots/inconsistent');
const VIEWPORT = { width: 375, height: 812 };

// Test credentials
const TEST_USER = {
  email: 'test@nestsync.ca',
  password: 'TestPassword123!'
};

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function captureInconsistentScreens() {
  console.log('🔍 Starting Design System Audit - Inconsistent Screen Capture\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  
  try {
    // Ensure screenshot directory exists
    await ensureDirectoryExists(SCREENSHOT_DIR);
    
    console.log('📱 Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Login if needed
    const isLoginPage = await page.locator('text=Sign In').isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // 1. Capture Premium Upgrade Flow
    console.log('📸 Capturing Premium Upgrade Flow...');
    
    const premiumUrls = [
      '/subscription/select-plan',
      '/(subscription)/select-plan',
      '/premium',
      '/upgrade'
    ];
    
    let premiumCaptured = false;
    for (const url of premiumUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const hasPremiumContent = await page.locator('text=/premium|upgrade|subscription|plan/i').isVisible().catch(() => false);
        
        if (hasPremiumContent) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '01-premium-upgrade-main.png'),
            fullPage: true
          });
          console.log('   ✅ Saved: 01-premium-upgrade-main.png');
          
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '01-premium-upgrade-viewport.png'),
            fullPage: false
          });
          console.log('   ✅ Saved: 01-premium-upgrade-viewport.png');
          premiumCaptured = true;
          break;
        }
      } catch (error) {
        // Continue to next URL
      }
    }
    
    if (!premiumCaptured) {
      console.log('   ⚠️  Premium upgrade screen not accessible');
    }
    
    // Try to capture plan selection cards
    if (premiumCaptured) {
      const planCards = page.locator('[data-testid*="plan"], .plan-card, [class*="plan"]');
      const cardCount = await planCards.count();
      if (cardCount > 0) {
        await planCards.first().screenshot({
          path: path.join(SCREENSHOT_DIR, '01-premium-plan-card.png')
        });
        console.log('   ✅ Saved: 01-premium-plan-card.png');
      }
    }
    
    // 2. Capture Reorder Flow
    console.log('📸 Capturing Reorder Flow...');
    
    const reorderUrls = [
      '/reorder-suggestions',
      '/reorder-suggestions-simple',
      '/reorder'
    ];
    
    let reorderCaptured = false;
    for (const url of reorderUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const hasReorderContent = await page.locator('text=/reorder|suggestion|low stock/i').isVisible().catch(() => false);
        
        if (hasReorderContent) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '02-reorder-flow-main.png'),
            fullPage: true
          });
          console.log('   ✅ Saved: 02-reorder-flow-main.png');
          
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '02-reorder-flow-viewport.png'),
            fullPage: false
          });
          console.log('   ✅ Saved: 02-reorder-flow-viewport.png');
          reorderCaptured = true;
          break;
        }
      } catch (error) {
        // Continue to next URL
      }
    }
    
    if (!reorderCaptured) {
      console.log('   ⚠️  Reorder flow screen not accessible');
    }
    
    // Capture reorder suggestion cards
    if (reorderCaptured) {
      const reorderCards = page.locator('[data-testid*="reorder"], [data-testid*="suggestion"]');
      const reorderCardCount = await reorderCards.count();
      if (reorderCardCount > 0) {
        await reorderCards.first().screenshot({
          path: path.join(SCREENSHOT_DIR, '02-reorder-suggestion-card.png')
        });
        console.log('   ✅ Saved: 02-reorder-suggestion-card.png');
      }
    }
    
    // 3. Capture Size Change Prediction Interface
    console.log('📸 Capturing Size Change Prediction Interface...');
    
    const predictionUrls = [
      '/size-guide',
      '/predictions',
      '/growth-predictions'
    ];
    
    let predictionCaptured = false;
    for (const url of predictionUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const hasPredictionContent = await page.locator('text=/size|prediction|growth|guide/i').isVisible().catch(() => false);
        
        if (hasPredictionContent) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '03-size-prediction-main.png'),
            fullPage: true
          });
          console.log('   ✅ Saved: 03-size-prediction-main.png');
          
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '03-size-prediction-viewport.png'),
            fullPage: false
          });
          console.log('   ✅ Saved: 03-size-prediction-viewport.png');
          predictionCaptured = true;
          break;
        }
      } catch (error) {
        // Continue to next URL
      }
    }
    
    if (!predictionCaptured) {
      console.log('   ⚠️  Size prediction screen not accessible');
    }
    
    // 4. Capture Payment-Related Screens
    console.log('📸 Capturing Payment-Related Screens...');
    
    const paymentUrls = [
      '/subscription/payment',
      '/(subscription)/payment',
      '/payment',
      '/checkout'
    ];
    
    let paymentCaptured = false;
    for (const url of paymentUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const hasPaymentContent = await page.locator('text=/payment|checkout|card|billing/i').isVisible().catch(() => false);
        
        if (hasPaymentContent) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '04-payment-screen-main.png'),
            fullPage: true
          });
          console.log('   ✅ Saved: 04-payment-screen-main.png');
          
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '04-payment-screen-viewport.png'),
            fullPage: false
          });
          console.log('   ✅ Saved: 04-payment-screen-viewport.png');
          paymentCaptured = true;
          break;
        }
      } catch (error) {
        // Continue to next URL
      }
    }
    
    if (!paymentCaptured) {
      console.log('   ⚠️  Payment screen not accessible');
    }
    
    // 5. Capture Trial Banner (if visible)
    console.log('📸 Capturing Trial Banner...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const trialBanner = page.locator('[data-testid*="trial"], [class*="trial"]').first();
    if (await trialBanner.isVisible().catch(() => false)) {
      await trialBanner.screenshot({
        path: path.join(SCREENSHOT_DIR, '05-trial-banner.png')
      });
      console.log('   ✅ Saved: 05-trial-banner.png');
    } else {
      console.log('   ⚠️  Trial banner not visible');
    }
    
    console.log('\n✨ Inconsistent screen capture complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    
  } catch (error) {
    console.error('❌ Error capturing inconsistent screens:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureInconsistentScreens().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
