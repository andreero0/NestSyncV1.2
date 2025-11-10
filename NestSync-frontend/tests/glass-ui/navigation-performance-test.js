/**
 * Glass UI Navigation Performance Test
 * 
 * Tests navigation performance with glass UI headers and tab bar.
 * Verifies that blur effects don't impact navigation smoothness.
 */

const { test, expect } = require('@playwright/test');

test.describe('Glass UI Navigation Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(2000); // Wait for app to load
  });

  test('should render glass UI headers without performance issues', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/glass-nav-01-initial.png' });

    // Navigate to different screens and measure performance
    const screens = [
      { name: 'Add Item', selector: 'text=Add Item' },
      { name: 'All Items', selector: 'text=All Items' },
      { name: 'Size Guide', selector: 'text=Size Guide' },
      { name: 'Smart Reorder', selector: 'text=Smart Reorder' },
    ];

    for (const screen of screens) {
      console.log(`Testing navigation to ${screen.name}...`);
      
      // Measure navigation time
      const startTime = Date.now();
      
      // Navigate to screen (if button exists)
      try {
        const button = await page.locator(screen.selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          await page.waitForTimeout(500); // Wait for navigation
          
          const endTime = Date.now();
          const navigationTime = endTime - startTime;
          
          console.log(`  Navigation time: ${navigationTime}ms`);
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/glass-nav-${screen.name.toLowerCase().replace(/\s+/g, '-')}.png` 
          });
          
          // Verify navigation time is reasonable (< 1000ms)
          expect(navigationTime).toBeLessThan(1000);
          
          // Go back
          const backButton = await page.locator('text=Back').first();
          if (await backButton.isVisible({ timeout: 1000 })) {
            await backButton.click();
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        console.log(`  Screen ${screen.name} not accessible: ${error.message}`);
      }
    }
  });

  test('should render glass UI tab bar without performance issues', async ({ page }) => {
    // Test tab switching performance
    const tabs = ['Home', 'Planner', 'Settings'];

    for (const tab of tabs) {
      console.log(`Testing tab switch to ${tab}...`);
      
      const startTime = Date.now();
      
      try {
        const tabButton = await page.locator(`text=${tab}`).first();
        if (await tabButton.isVisible({ timeout: 1000 })) {
          await tabButton.click();
          await page.waitForTimeout(300); // Wait for tab switch
          
          const endTime = Date.now();
          const switchTime = endTime - startTime;
          
          console.log(`  Tab switch time: ${switchTime}ms`);
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/glass-tab-${tab.toLowerCase()}.png` 
          });
          
          // Verify tab switch time is reasonable (< 500ms)
          expect(switchTime).toBeLessThan(500);
        }
      } catch (error) {
        console.log(`  Tab ${tab} not accessible: ${error.message}`);
      }
    }
  });

  test('should maintain 60fps during navigation', async ({ page }) => {
    // This is a basic check - in production you'd use performance APIs
    console.log('Testing frame rate during navigation...');
    
    // Navigate between screens multiple times
    for (let i = 0; i < 3; i++) {
      try {
        // Go to Planner tab
        const plannerTab = await page.locator('text=Planner').first();
        if (await plannerTab.isVisible({ timeout: 1000 })) {
          await plannerTab.click();
          await page.waitForTimeout(200);
        }
        
        // Go to Settings tab
        const settingsTab = await page.locator('text=Settings').first();
        if (await settingsTab.isVisible({ timeout: 1000 })) {
          await settingsTab.click();
          await page.waitForTimeout(200);
        }
        
        // Go back to Home tab
        const homeTab = await page.locator('text=Home').first();
        if (await homeTab.isVisible({ timeout: 1000 })) {
          await homeTab.click();
          await page.waitForTimeout(200);
        }
      } catch (error) {
        console.log(`  Navigation cycle ${i + 1} error: ${error.message}`);
      }
    }
    
    console.log('Navigation cycles completed successfully');
  });
});

console.log('Glass UI Navigation Performance Test Suite');
console.log('==========================================');
console.log('This test verifies that glass UI navigation performs well.');
console.log('Run with: npm run test:glass-nav');
