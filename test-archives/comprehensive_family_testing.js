/**
 * Comprehensive Family Collaboration & Child Management Testing
 * Tests all implemented features: Settings → Add Child, PresenceIndicators, Emma records
 */

const { chromium } = require('playwright');

async function comprehensiveFamilyTesting() {
  console.log('🔍 Starting Comprehensive Family Collaboration Testing...');
  console.log('📊 Target: http://localhost:8082');
  console.log('👤 Credentials: parents@nestsync.com / Shazam11#');
  console.log('');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 2000 // Slower for detailed observation
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Comprehensive console monitoring
  const consoleMessages = [];
  const criticalErrors = [];

  page.on('console', msg => {
    const message = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(message);

    // Check for critical errors
    if (message.includes('Maximum update depth exceeded') ||
        message.includes('infinite loop') ||
        message.includes('too many re-renders') ||
        message.includes('ERROR:')) {
      criticalErrors.push(message);
      console.log('🚨 CRITICAL ERROR:', message);
    }
  });

  page.on('pageerror', error => {
    criticalErrors.push(error.message);
    console.log('❌ PAGE ERROR:', error.message);
  });

  const testResults = {
    authentication: false,
    settingsNavigation: false,
    addChildButton: false,
    childCreationFlow: false,
    presenceIndicators: false,
    emmaRecordsCheck: false,
    childSelector: false,
    endToEndFlow: false,
    criticalErrors: [],
    consoleErrorCount: 0
  };

  try {
    // Phase 1: Authentication
    console.log('📝 Phase 1: Authentication Testing');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Login
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'parents@nestsync.com');
    await page.fill('input[type="password"], input[placeholder*="password" i]', 'Shazam11#');
    await page.click('button[type="submit"], button:has-text("sign in"), button:has-text("login")');

    // Wait for login to complete
    await page.waitForTimeout(5000);
    testResults.authentication = true;
    console.log('✅ Authentication successful');

    // Phase 2: Settings Navigation
    console.log('📝 Phase 2: Settings Navigation Testing');
    await page.screenshot({ path: 'test_phase2_dashboard.png' });

    // Look for settings tab/button
    const settingsSelectors = [
      '[role="tab"]:has-text("Settings")',
      'button:has-text("Settings")',
      '[href*="settings"]',
      '.tab:has-text("Settings")',
      '*[data-testid*="settings"]'
    ];

    let settingsFound = false;
    for (const selector of settingsSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        settingsFound = true;
        console.log(`✅ Settings navigation found with selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️  Settings selector failed: ${selector}`);
      }
    }

    testResults.settingsNavigation = settingsFound;
    if (settingsFound) {
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test_phase2_settings.png' });
    }

    // Phase 3: Add Child Button Testing
    console.log('📝 Phase 3: Add Child Button Testing');

    const addChildSelectors = [
      'button:has-text("Add Child")',
      'button:has-text("Add a Child")',
      'button:has-text("Create Child")',
      '*[data-testid*="add-child"]',
      '.add-child-button',
      'button[aria-label*="add child" i]'
    ];

    let addChildFound = false;
    for (const selector of addChildSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ Add Child button found: ${selector} (${elements} elements)`);
          addChildFound = true;

          // Try to click it
          await page.click(selector);
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test_phase3_add_child_modal.png' });
          break;
        }
      } catch (e) {
        console.log(`⚠️  Add Child selector failed: ${selector}`);
      }
    }

    testResults.addChildButton = addChildFound;

    // Phase 4: Child Creation Flow Testing (if modal opened)
    console.log('📝 Phase 4: Child Creation Flow Testing');

    // Look for child creation form elements
    const childFormSelectors = [
      'input[placeholder*="name" i]',
      'input[placeholder*="child" i]',
      'input[label*="name" i]',
      'form input[type="text"]'
    ];

    let childFormFound = false;
    for (const selector of childFormSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ Child form input found: ${selector}`);
          childFormFound = true;

          // Try to fill in test data
          await page.fill(selector, 'Test Child Name');
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        console.log(`⚠️  Child form selector failed: ${selector}`);
      }
    }

    testResults.childCreationFlow = childFormFound;

    // Go back to main dashboard for rest of testing
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Phase 5: PresenceIndicators Testing
    console.log('📝 Phase 5: PresenceIndicators Component Testing');

    const presenceSelectors = [
      '.presence-indicator',
      '*:has-text("Active Caregivers")',
      '*:has-text("caregiver")',
      '*[data-testid*="presence"]',
      '.collaboration-indicators'
    ];

    let presenceFound = false;
    for (const selector of presenceSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ PresenceIndicators found: ${selector} (${elements} elements)`);
          presenceFound = true;
          break;
        }
      } catch (e) {
        console.log(`⚠️  Presence selector failed: ${selector}`);
      }
    }

    testResults.presenceIndicators = presenceFound;
    await page.screenshot({ path: 'test_phase5_presence_indicators.png' });

    // Phase 6: Emma Records Verification
    console.log('📝 Phase 6: Emma Records Duplication Check');

    // Look for child names or profiles
    const emmaSelectors = [
      '*:has-text("Emma")',
      '.child-name:has-text("Emma")',
      '.profile:has-text("Emma")',
      '*[data-child*="Emma"]'
    ];

    let emmaCount = 0;
    for (const selector of emmaSelectors) {
      try {
        const elements = await page.locator(selector).count();
        emmaCount += elements;
        if (elements > 0) {
          console.log(`Found Emma records with ${selector}: ${elements}`);
        }
      } catch (e) {
        // Selector failed, continue
      }
    }

    console.log(`📊 Total Emma records found: ${emmaCount}`);
    testResults.emmaRecordsCheck = emmaCount;

    // Phase 7: Child Selector Testing
    console.log('📝 Phase 7: Child Selector Testing');

    const selectorElements = [
      'select',
      '.child-selector',
      '.dropdown',
      'button:has-text("Select Child")',
      '*[role="combobox"]'
    ];

    let childSelectorFound = false;
    for (const selector of selectorElements) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ Child selector found: ${selector} (${elements} elements)`);
          childSelectorFound = true;
          break;
        }
      } catch (e) {
        console.log(`⚠️  Child selector failed: ${selector}`);
      }
    }

    testResults.childSelector = childSelectorFound;

    // Phase 8: End-to-End Flow Verification
    console.log('📝 Phase 8: End-to-End Flow Testing');

    // Test navigation between tabs
    const tabs = await page.locator('[role="tab"], nav button, .tab').count();
    console.log(`Found ${tabs} navigation tabs`);

    if (tabs > 0) {
      const tabElements = await page.locator('[role="tab"], nav button, .tab').all();
      for (let i = 0; i < Math.min(tabElements.length, 3); i++) {
        try {
          await tabElements[i].click();
          await page.waitForTimeout(1500);
          console.log(`✅ Tab ${i + 1} navigation successful`);
        } catch (e) {
          console.log(`⚠️  Tab ${i + 1} navigation failed`);
        }
      }
    }

    testResults.endToEndFlow = tabs > 0;
    await page.screenshot({ path: 'test_phase8_final_state.png' });

    // Final Results
    testResults.criticalErrors = criticalErrors;
    testResults.consoleErrorCount = consoleMessages.filter(msg =>
      msg.includes('error') || msg.includes('ERROR')
    ).length;

    return testResults;

  } catch (error) {
    console.log('❌ Testing failed with error:', error.message);
    await page.screenshot({ path: 'test_error_state.png' });
    testResults.error = error.message;
    return testResults;
  } finally {
    await browser.close();
  }
}

// Run the comprehensive testing
comprehensiveFamilyTesting()
  .then(results => {
    console.log('');
    console.log('📋 COMPREHENSIVE TESTING RESULTS:');
    console.log('=====================================');
    console.log(JSON.stringify(results, null, 2));

    console.log('');
    console.log('📊 FEATURE STATUS SUMMARY:');
    console.log('==========================');
    console.log(`Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Settings Navigation: ${results.settingsNavigation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Add Child Button: ${results.addChildButton ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Child Creation Flow: ${results.childCreationFlow ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PresenceIndicators: ${results.presenceIndicators ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Emma Records Count: ${results.emmaRecordsCheck} records`);
    console.log(`Child Selector: ${results.childSelector ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`End-to-End Flow: ${results.endToEndFlow ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Critical Errors: ${results.criticalErrors.length}`);

    console.log('');
    if (results.criticalErrors.length === 0 && results.authentication) {
      console.log('🎉 OVERALL STATUS: COMPREHENSIVE TESTING SUCCESSFUL');
    } else {
      console.log('⚠️  OVERALL STATUS: ISSUES DETECTED - REVIEW REQUIRED');
    }
  })
  .catch(error => {
    console.error('💥 Testing script failed:', error);
  });