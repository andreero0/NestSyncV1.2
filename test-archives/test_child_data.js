const { chromium } = require('playwright');

async function testChildDataFunctionality() {
    console.log('🧪 Starting comprehensive child data testing...');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capture console logs
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
        console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture network errors
    const networkErrors = [];
    page.on('requestfailed', request => {
        networkErrors.push({
            url: request.url(),
            error: request.failure().errorText,
            timestamp: new Date().toISOString()
        });
    });

    try {
        // Phase 1: Navigate and Login
        console.log('\n📱 Phase 1: Navigation and Login');
        await page.goto('http://localhost:8083');
        await page.waitForLoadState('networkidle');

        // Take initial screenshot
        await page.screenshot({
            path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/01-initial-load.png',
            fullPage: true
        });

        // Look for login form
        console.log('Looking for login elements...');
        const emailInput = await page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
        const passwordInput = await page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first();

        if (await emailInput.count() === 0) {
            console.log('No email input found - checking if already logged in...');
            // Check if we're already on dashboard
            const dashboardIndicators = await page.locator('text=Dashboard, text=Children, text=Emma').count();
            if (dashboardIndicators > 0) {
                console.log('✅ Already logged in - proceeding to child data testing');
            } else {
                console.log('❌ Login form not found and not on dashboard');
                await page.screenshot({
                    path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/error-no-login-form.png',
                    fullPage: true
                });
            }
        } else {
            console.log('Found login form - proceeding with credentials...');
            await emailInput.fill('parents@nestsync.com');
            await passwordInput.fill('Shazam11#');

            await page.screenshot({
                path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/02-login-filled.png',
                fullPage: true
            });

            // Look for login button
            const loginButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In")').first();
            if (await loginButton.count() > 0) {
                await loginButton.click();
                console.log('Login button clicked - waiting for redirect...');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000); // Extra wait for React state updates
            }
        }

        // Phase 2: Child Data Verification
        console.log('\n👶 Phase 2: Child Data Verification');
        await page.waitForTimeout(2000); // Allow data to load

        // Take post-login screenshot
        await page.screenshot({
            path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/03-post-login.png',
            fullPage: true
        });

        // Count Emma records - try multiple selectors
        const emmaSelectors = [
            'text=Emma',
            '[data-testid*="emma"]',
            '[data-testid*="child"]',
            '.child-card',
            '.child-item',
            '[class*="child"]'
        ];

        let emmaCount = 0;
        let foundEmmaElements = [];

        for (const selector of emmaSelectors) {
            const elements = await page.locator(selector).all();
            for (const element of elements) {
                const text = await element.textContent();
                if (text && text.toLowerCase().includes('emma')) {
                    foundEmmaElements.push({
                        selector,
                        text: text.trim(),
                        boundingBox: await element.boundingBox()
                    });
                    emmaCount++;
                }
            }
        }

        console.log(`🔍 Found ${emmaCount} Emma-related elements:`);
        foundEmmaElements.forEach((elem, i) => {
            console.log(`  ${i + 1}. Selector: ${elem.selector}, Text: "${elem.text}"`);
        });

        // Phase 3: Child Selector Modal Testing
        console.log('\n🎛️ Phase 3: Child Selector Modal Testing');

        // Look for child selector buttons or dropdowns
        const childSelectorElements = [
            'button:has-text("Select Child")',
            'button:has-text("Choose Child")',
            '[data-testid*="child-selector"]',
            '[data-testid*="child-dropdown"]',
            'button[aria-label*="child"]',
            '.child-selector',
            'select[name*="child"]'
        ];

        let selectorFound = false;
        for (const selector of childSelectorElements) {
            const element = page.locator(selector).first();
            if (await element.count() > 0) {
                console.log(`Found child selector: ${selector}`);
                selectorFound = true;

                // Take screenshot before clicking
                await page.screenshot({
                    path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/04-before-selector-click.png',
                    fullPage: true
                });

                try {
                    await element.click();
                    await page.waitForTimeout(1000);

                    // Take screenshot after clicking
                    await page.screenshot({
                        path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/05-selector-opened.png',
                        fullPage: true
                    });

                    // Count Emma entries in the opened selector
                    const modalEmmaCount = await page.locator('text=Emma').count();
                    console.log(`📋 Emma entries in selector: ${modalEmmaCount}`);

                    // Close the selector if possible
                    const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]').first();
                    if (await closeButton.count() > 0) {
                        await closeButton.click();
                    } else {
                        // Try clicking outside the modal
                        await page.click('body', { position: { x: 10, y: 10 } });
                    }

                } catch (error) {
                    console.log(`Error clicking selector: ${error.message}`);
                }
                break;
            }
        }

        if (!selectorFound) {
            console.log('⚠️ No child selector elements found');
        }

        // Phase 4: Console Error Analysis
        console.log('\n🔍 Phase 4: Console Error Analysis');

        const reactKeyErrors = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('duplicate') ||
            msg.text.toLowerCase().includes('key') ||
            msg.text.toLowerCase().includes('warning')
        );

        console.log(`Found ${reactKeyErrors.length} potential React key/duplicate warnings:`);
        reactKeyErrors.forEach((error, i) => {
            console.log(`  ${i + 1}. [${error.type}] ${error.text}`);
        });

        const graphqlErrors = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('graphql') ||
            msg.text.toLowerCase().includes('apollo') ||
            msg.text.toLowerCase().includes('child')
        );

        console.log(`Found ${graphqlErrors.length} GraphQL/Apollo related messages:`);
        graphqlErrors.forEach((msg, i) => {
            console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
        });

        // Final comprehensive screenshot
        await page.screenshot({
            path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/06-final-state.png',
            fullPage: true
        });

        // Summary Report
        console.log('\n📊 COMPREHENSIVE TEST RESULTS');
        console.log('=====================================');
        console.log(`✅ Emma Records Found: ${emmaCount}`);
        console.log(`⚠️ React Key Warnings: ${reactKeyErrors.length}`);
        console.log(`🔌 GraphQL Messages: ${graphqlErrors.length}`);
        console.log(`🌐 Network Errors: ${networkErrors.length}`);
        console.log(`🎛️ Child Selector Found: ${selectorFound ? 'Yes' : 'No'}`);

        // Write detailed report to file
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                emmaRecordsCount: emmaCount,
                reactKeyWarnings: reactKeyErrors.length,
                graphqlMessages: graphqlErrors.length,
                networkErrors: networkErrors.length,
                childSelectorFound: selectorFound
            },
            emmaElements: foundEmmaElements,
            consoleMessages: consoleMessages,
            networkErrors: networkErrors,
            conclusion: emmaCount === 1 ? 'PASS: Single Emma record found' :
                       emmaCount === 0 ? 'FAIL: No Emma records found' :
                       'FAIL: Multiple Emma records found (duplication issue)'
        };

        await page.evaluate((report) => {
            console.log('📝 Writing test report...');
        }, report);

        const fs = require('fs');
        fs.writeFileSync(
            '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/child-data-test-report.json',
            JSON.stringify(report, null, 2)
        );

        console.log('📝 Test report saved to: child-data-test-report.json');
        console.log('📸 Screenshots saved to: test-screenshots/ directory');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({
            path: '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/error-final.png',
            fullPage: true
        });
    } finally {
        await browser.close();
    }
}

// Create screenshots directory
const fs = require('fs');
const screenshotsDir = '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots';
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

testChildDataFunctionality().catch(console.error);