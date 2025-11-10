/**
 * Design System Audit - Reference Screen Capture
 * 
 * This script captures screenshots of reference screens that exemplify
 * the established design system (home, settings, onboarding, navigation).
 * 
 * These screenshots will be used to extract design tokens and compare
 * against inconsistent screens.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:19006';
const SCREENSHOT_DIR = path.join(__dirname, '../audit-screenshots/reference');
const VIEWPORT = { width: 375, height: 812 }; // iPhone X dimensions

// Test credentials (from test data)
const TEST_USER = {
  email: 'test@nestsync.ca',
  password: 'TestPassword123!'
};

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function captureReferenceScreens() {
  console.log('🎨 Starting Design System Audit - Reference Screen Capture\n');
  
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
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    const isLoginPage = await page.locator('text=Sign In').isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // 1. Capture Home Screen
    console.log('📸 Capturing Home Screen...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-home-screen-full.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 01-home-screen-full.png');
    
    // Capture home screen viewport only
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-home-screen-viewport.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 01-home-screen-viewport.png');
    
    // 2. Capture Settings Screen
    console.log('📸 Capturing Settings Screen...');
    await page.goto(`${BASE_URL}/profile-settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-settings-screen-full.png'),
      fullPage: true
    });
    console.log('   ✅ Saved: 02-settings-screen-full.png');
    
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-settings-screen-viewport.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 02-settings-screen-viewport.png');
    
    // 3. Capture Navigation Elements
    console.log('📸 Capturing Navigation Elements...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Try to capture tab bar if visible
    const tabBar = page.locator('[role="tablist"], [data-testid="tab-bar"]').first();
    if (await tabBar.isVisible().catch(() => false)) {
      await tabBar.screenshot({
        path: path.join(SCREENSHOT_DIR, '03-navigation-tab-bar.png')
      });
      console.log('   ✅ Saved: 03-navigation-tab-bar.png');
    }
    
    // Capture full navigation context
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-navigation-full-context.png'),
      fullPage: false
    });
    console.log('   ✅ Saved: 03-navigation-full-context.png');
    
    // 4. Capture Onboarding Flow (if accessible)
    console.log('📸 Attempting to capture Onboarding Flow...');
    
    // Try to navigate to onboarding
    const onboardingUrls = [
      '/onboarding',
      '/(auth)/onboarding',
      '/welcome'
    ];
    
    let onboardingCaptured = false;
    for (const url of onboardingUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Check if we're on an onboarding screen
        const hasOnboardingContent = await page.locator('text=/welcome|get started|onboarding/i').isVisible().catch(() => false);
        
        if (hasOnboardingContent) {
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '04-onboarding-screen.png'),
            fullPage: true
          });
          console.log('   ✅ Saved: 04-onboarding-screen.png');
          onboardingCaptured = true;
          break;
        }
      } catch (error) {
        // Continue to next URL
      }
    }
    
    if (!onboardingCaptured) {
      console.log('   ⚠️  Onboarding screen not accessible (may require logout)');
    }
    
    // 5. Capture Component Details
    console.log('📸 Capturing Component Details...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Capture buttons
    const buttons = page.locator('button').first();
    if (await buttons.isVisible().catch(() => false)) {
      await buttons.screenshot({
        path: path.join(SCREENSHOT_DIR, '05-button-component.png')
      });
      console.log('   ✅ Saved: 05-button-component.png');
    }
    
    // Capture cards
    const cards = page.locator('[data-testid*="card"], .card').first();
    if (await cards.isVisible().catch(() => false)) {
      await cards.screenshot({
        path: path.join(SCREENSHOT_DIR, '05-card-component.png')
      });
      console.log('   ✅ Saved: 05-card-component.png');
    }
    
    console.log('\n✨ Reference screen capture complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    
  } catch (error) {
    console.error('❌ Error capturing reference screens:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the capture
captureReferenceScreens().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
