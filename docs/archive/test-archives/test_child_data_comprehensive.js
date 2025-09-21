const { chromium } = require('playwright');

async function comprehensiveChildDataTest() {
    console.log('🔍 COMPREHENSIVE CHILD DATA TESTING');
    console.log('=====================================');

    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Enhanced console monitoring
    const consoleMessages = [];
    const graphqlMessages = [];
    const authMessages = [];
    const childMessages = [];

    page.on('console', msg => {
        const message = {
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        };

        consoleMessages.push(message);

        // Categorize messages
        const text = msg.text().toLowerCase();
        if (text.includes('graphql') || text.includes('apollo') || text.includes('query') || text.includes('mutation')) {
            graphqlMessages.push(message);
        }
        if (text.includes('auth') || text.includes('login') || text.includes('token') || text.includes('session')) {
            authMessages.push(message);
        }
        if (text.includes('child') || text.includes('emma') || text.includes('children')) {
            childMessages.push(message);
        }

        console.log(`[${msg.type()}] ${msg.text()}`);
    });

    // Network monitoring
    const networkErrors = [];
    const networkRequests = [];

    page.on('requestfailed', request => {
        networkErrors.push({
            url: request.url(),
            error: request.failure().errorText,
            method: request.method(),
            timestamp: new Date().toISOString()
        });
    });

    page.on('response', response => {
        if (response.url().includes('graphql') || response.url().includes('child')) {
            networkRequests.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method(),
                timestamp: new Date().toISOString()
            });
        }
    });

    try {
        // Test both ports to understand differences
        const portsToTest = [
            { port: 8083, description: 'Web Build (Requested Port)' },
            { port: 8082, description: 'Main Expo Server (Documented Port)' }
        ];

        for (const testPort of portsToTest) {
            console.log(`\n🌐 Testing Port ${testPort.port}: ${testPort.description}`);
            console.log('='.repeat(60));

            const url = `http://localhost:${testPort.port}`;

            try {
                await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
                await page.waitForTimeout(5000); // Allow app to fully initialize

                // Take initial screenshot
                await page.screenshot({
                    path: `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/port-${testPort.port}-initial.png`,
                    fullPage: true
                });

                // Check for loading states
                const loadingIndicators = await page.locator('text=Loading, text=Please wait, [data-testid*="loading"], .loading, [class*="loading"]').count();
                console.log(`📋 Loading indicators found: ${loadingIndicators}`);

                if (loadingIndicators > 0) {
                    console.log('⏱️ Waiting for loading to complete...');
                    await page.waitForFunction(() => {
                        const loading = document.querySelectorAll('[class*="loading"], [data-testid*="loading"]');
                        return loading.length === 0;
                    }, { timeout: 15000 }).catch(() => console.log('Loading timeout'));
                }

                // Wait for authentication to complete
                await page.waitForTimeout(3000);

                // Look for authentication elements
                const authElements = {
                    signInButton: await page.locator('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In")').count(),
                    emailInput: await page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').count(),
                    passwordInput: await page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').count(),
                    signUpButton: await page.locator('button:has-text("Sign Up"), button:has-text("Register"), button:has-text("Create Account")').count()
                };

                console.log('🔐 Authentication Elements:', authElements);

                // Look for main app elements
                const appElements = {
                    dashboard: await page.locator('text=Dashboard, [data-testid*="dashboard"], .dashboard').count(),
                    navigation: await page.locator('[role="navigation"], nav, .navigation, .nav, [data-testid*="nav"]').count(),
                    tabBar: await page.locator('[role="tablist"], .tab-bar, [data-testid*="tab"]').count(),
                    childElements: await page.locator('text=Emma, text=Child, text=Children, [data-testid*="child"]').count()
                };

                console.log('📱 App Elements:', appElements);

                // If we found auth elements, try to login
                if (authElements.emailInput > 0 && authElements.passwordInput > 0) {
                    console.log('🔑 Attempting login...');

                    const emailInput = page.locator('input[type="email"], input[placeholder*="email"], input[name="email"]').first();
                    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"], input[name="password"]').first();

                    await emailInput.fill('parents@nestsync.com');
                    await passwordInput.fill('Shazam11#');

                    await page.screenshot({
                        path: `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/port-${testPort.port}-login-filled.png`,
                        fullPage: true
                    });

                    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In"), button[type="submit"]').first();
                    if (await loginButton.count() > 0) {
                        await loginButton.click();
                        console.log('✅ Login button clicked, waiting for response...');

                        // Wait for navigation or content change
                        await page.waitForTimeout(5000);

                        // Wait for any network requests to complete
                        await page.waitForLoadState('networkidle');
                    }
                }

                // Take post-login/interaction screenshot
                await page.screenshot({
                    path: `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/port-${testPort.port}-post-login.png`,
                    fullPage: true
                });

                // Comprehensive Emma search
                console.log('👶 Searching for Emma records...');

                const emmaSearchSelectors = [
                    'text=Emma',
                    'text="Emma"',
                    '[data-testid*="emma"]',
                    '[data-testid*="child"]',
                    '[aria-label*="Emma"]',
                    '[title*="Emma"]',
                    '.child-card',
                    '.child-item',
                    '.child-profile',
                    '[class*="child"]',
                    '[id*="emma"]',
                    '[id*="child"]'
                ];

                let totalEmmaCount = 0;
                const foundEmmaElements = [];

                for (const selector of emmaSearchSelectors) {
                    try {
                        const elements = await page.locator(selector).all();

                        for (let i = 0; i < elements.length; i++) {
                            const element = elements[i];
                            const text = await element.textContent().catch(() => '');
                            const innerHTML = await element.innerHTML().catch(() => '');

                            if (text && (text.toLowerCase().includes('emma') || innerHTML.toLowerCase().includes('emma'))) {
                                foundEmmaElements.push({
                                    selector,
                                    text: text.trim(),
                                    innerHTML: innerHTML.trim().substring(0, 200) + '...',
                                    boundingBox: await element.boundingBox().catch(() => null)
                                });
                                totalEmmaCount++;
                            }
                        }
                    } catch (error) {
                        // Selector might not be valid, continue
                    }
                }

                console.log(`📊 Emma Records Found on Port ${testPort.port}: ${totalEmmaCount}`);
                foundEmmaElements.forEach((elem, i) => {
                    console.log(`  ${i + 1}. [${elem.selector}] "${elem.text}"`);
                });

                // Look for child selectors/dropdowns
                console.log('🎛️ Searching for child selectors...');

                const childSelectorSelectors = [
                    'select[name*="child"]',
                    'button:has-text("Select Child")',
                    'button:has-text("Choose Child")',
                    '[data-testid*="child-selector"]',
                    '[data-testid*="child-dropdown"]',
                    '[aria-label*="child selector"]',
                    '.child-selector',
                    '.dropdown',
                    '[role="listbox"]',
                    '[role="combobox"]'
                ];

                let childSelectorFound = false;
                for (const selector of childSelectorSelectors) {
                    const count = await page.locator(selector).count();
                    if (count > 0) {
                        console.log(`✅ Found child selector: ${selector} (${count} elements)`);
                        childSelectorFound = true;

                        // Try to interact with the first one
                        try {
                            const element = page.locator(selector).first();
                            await element.click();
                            await page.waitForTimeout(2000);

                            // Count Emma entries in opened selector
                            const modalEmmaCount = await page.locator('text=Emma').count();
                            console.log(`📋 Emma entries in opened selector: ${modalEmmaCount}`);

                            await page.screenshot({
                                path: `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/port-${testPort.port}-selector-opened.png`,
                                fullPage: true
                            });

                            // Close selector
                            await page.keyboard.press('Escape');
                            await page.click('body', { position: { x: 10, y: 10 } });

                        } catch (error) {
                            console.log(`⚠️ Could not interact with selector: ${error.message}`);
                        }
                        break;
                    }
                }

                if (!childSelectorFound) {
                    console.log('❌ No child selector elements found');
                }

                // Final screenshot for this port
                await page.screenshot({
                    path: `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/port-${testPort.port}-final.png`,
                    fullPage: true
                });

                console.log(`\n📊 Port ${testPort.port} Summary:`);
                console.log(`  - Emma Records: ${totalEmmaCount}`);
                console.log(`  - Child Selector Found: ${childSelectorFound ? 'Yes' : 'No'}`);
                console.log(`  - Auth Elements: ${Object.values(authElements).reduce((a, b) => a + b, 0)}`);
                console.log(`  - App Elements: ${Object.values(appElements).reduce((a, b) => a + b, 0)}`);

            } catch (error) {
                console.error(`❌ Error testing port ${testPort.port}:`, error.message);
                await page.screenshot({
                    path: `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/test-screenshots/port-${testPort.port}-error.png`,
                    fullPage: true
                });
            }
        }

        // Analyze console messages
        console.log('\n🔍 CONSOLE MESSAGE ANALYSIS');
        console.log('============================');
        console.log(`📝 Total Console Messages: ${consoleMessages.length}`);
        console.log(`🔐 Auth Related Messages: ${authMessages.length}`);
        console.log(`🔌 GraphQL Messages: ${graphqlMessages.length}`);
        console.log(`👶 Child Related Messages: ${childMessages.length}`);
        console.log(`🌐 Network Errors: ${networkErrors.length}`);
        console.log(`📡 GraphQL Requests: ${networkRequests.length}`);

        // Show key messages
        if (authMessages.length > 0) {
            console.log('\n🔐 Key Auth Messages:');
            authMessages.slice(0, 5).forEach((msg, i) => {
                console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
            });
        }

        if (childMessages.length > 0) {
            console.log('\n👶 Child Related Messages:');
            childMessages.forEach((msg, i) => {
                console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
            });
        }

        if (graphqlMessages.length > 0) {
            console.log('\n🔌 GraphQL Messages:');
            graphqlMessages.forEach((msg, i) => {
                console.log(`  ${i + 1}. [${msg.type}] ${msg.text}`);
            });
        }

        if (networkErrors.length > 0) {
            console.log('\n❌ Network Errors:');
            networkErrors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error.method} ${error.url}: ${error.error}`);
            });
        }

        // Generate comprehensive report
        const report = {
            timestamp: new Date().toISOString(),
            testSummary: {
                totalEmmaRecords: 0, // Will be updated per port
                authenticationWorking: authMessages.some(msg => msg.text.includes('authenticated')),
                applicationLoading: consoleMessages.some(msg => msg.text.includes('Running application')),
                graphqlConnectivity: networkRequests.length > 0,
                networkErrors: networkErrors.length
            },
            consoleAnalysis: {
                totalMessages: consoleMessages.length,
                authMessages: authMessages.length,
                graphqlMessages: graphqlMessages.length,
                childMessages: childMessages.length,
                networkErrors: networkErrors.length
            },
            recommendations: []
        };

        // Add recommendations based on findings
        if (networkErrors.length > 0) {
            report.recommendations.push('❌ Network connectivity issues detected - check backend server');
        }
        if (authMessages.some(msg => msg.text.includes('fallback mode'))) {
            report.recommendations.push('🔐 Authentication falling back to offline mode - verify auth configuration');
        }
        if (graphqlMessages.length === 0) {
            report.recommendations.push('🔌 No GraphQL activity detected - verify GraphQL client configuration');
        }
        if (childMessages.length === 0) {
            report.recommendations.push('👶 No child-related activity in logs - check child data loading');
        }

        // Save comprehensive report
        const fs = require('fs');
        fs.writeFileSync(
            '/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/comprehensive-child-test-report.json',
            JSON.stringify({
                report,
                detailedLogs: {
                    allConsoleMessages: consoleMessages,
                    authMessages,
                    graphqlMessages,
                    childMessages,
                    networkErrors,
                    networkRequests
                }
            }, null, 2)
        );

        console.log('\n✅ COMPREHENSIVE TEST COMPLETED');
        console.log('=====================================');
        console.log('📝 Report saved: comprehensive-child-test-report.json');
        console.log('📸 Screenshots saved: test-screenshots/ directory');

    } catch (error) {
        console.error('❌ Comprehensive test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
comprehensiveChildDataTest().catch(console.error);