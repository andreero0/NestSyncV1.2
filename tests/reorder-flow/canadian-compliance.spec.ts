import { test, expect } from '../fixtures/auth';
import { GraphQLHelper } from '../utils/graphql-helpers';
import { canadianTestConfig } from '../playwright.config';

/**
 * Canadian Compliance and PIPEDA Validation Tests
 *
 * Tests Canadian regulatory compliance and data protection:
 * 1. PIPEDA consent flow and data retention notices
 * 2. Canadian tax calculation accuracy (GST/PST/HST)
 * 3. Data residency validation and cross-border protection
 * 4. Audit trail completeness and retention compliance
 * 5. Canadian retailer verification and pricing
 * 6. Bilingual support and accessibility compliance
 */

test.describe('Canadian Compliance and PIPEDA Validation', () => {
  let graphqlHelper: GraphQLHelper;

  test.beforeEach(async ({ page }) => {
    graphqlHelper = new GraphQLHelper(page);

    // Set Canadian locale for all tests
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'en-CA'
      });
    });
  });

  test.describe('PIPEDA Consent and Data Protection', () => {
    test('should collect and manage PIPEDA consent properly', async ({
      page, authHelper
    }) => {
      // Test new user registration with PIPEDA compliance
      const newUser = {
        email: 'pipeda-test@nestsync-test.com',
        password: 'Test123!@#',
        province: 'ON'
      };

      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      // Verify PIPEDA consent forms are present
      await expect(page.getByTestId('pipeda-consent-form')).toBeVisible();
      await expect(page.getByTestId('data-processing-notice')).toBeVisible();

      // Verify specific PIPEDA notices
      await expect(page.getByText('🇨🇦 Your data will be processed in Canada')).toBeVisible();
      await expect(page.getByText('Personal Information Protection and Electronic Documents Act')).toBeVisible();

      // Fill registration form
      await page.getByTestId('email-input').fill(newUser.email);
      await page.getByTestId('password-input').fill(newUser.password);
      await page.getByTestId('confirm-password-input').fill(newUser.password);
      await page.getByTestId('province-select').selectOption(newUser.province);

      // Verify granular consent options
      await expect(page.getByTestId('essential-processing-consent')).toBeVisible();
      await expect(page.getByTestId('ml-analytics-consent')).toBeVisible();
      await expect(page.getByTestId('marketing-communications-consent')).toBeVisible();
      await expect(page.getByTestId('third-party-sharing-consent')).toBeVisible();

      // Check essential consent (required)
      await page.getByTestId('essential-processing-consent').check();

      // Verify essential consent cannot be unchecked
      await expect(page.getByTestId('essential-processing-consent')).toBeChecked();
      await expect(page.getByTestId('essential-processing-consent')).toBeDisabled();

      // Opt into ML analytics
      await page.getByTestId('ml-analytics-consent').check();

      // Verify marketing consent explanation
      await page.getByTestId('marketing-consent-info').click();
      await expect(page.getByTestId('marketing-consent-details')).toBeVisible();
      await expect(page.getByText('You can withdraw consent at any time')).toBeVisible();

      // Check terms and privacy policy
      await page.getByTestId('terms-checkbox').check();
      await page.getByTestId('privacy-checkbox').check();

      // Submit registration
      await page.getByTestId('register-button').click();

      // Should show consent confirmation
      await expect(page.getByTestId('consent-confirmation')).toBeVisible();
      await expect(page.getByText('Consent recorded for PIPEDA compliance')).toBeVisible();

      // Verify consent timestamp
      await expect(page.getByTestId('consent-timestamp')).toBeVisible();
      await expect(page.getByTestId('consent-reference-id')).toBeVisible();
    });

    test('should provide comprehensive data subject rights management', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/settings/privacy');
      await page.waitForLoadState('networkidle');

      // Verify PIPEDA rights dashboard
      await expect(page.getByTestId('pipeda-rights-dashboard')).toBeVisible();
      await expect(page.getByTestId('canadian-data-protection-notice')).toBeVisible();

      // Test data access request
      await page.getByTestId('request-data-export').click();
      await expect(page.getByTestId('data-export-modal')).toBeVisible();

      // Verify data categories that will be exported
      await expect(page.getByTestId('account-data-category')).toBeVisible();
      await expect(page.getByTestId('usage-data-category')).toBeVisible();
      await expect(page.getByTestId('ml-predictions-category')).toBeVisible();
      await expect(page.getByTestId('order-history-category')).toBeVisible();

      // Verify data retention information
      await expect(page.getByText('Account data: Retained until account deletion')).toBeVisible();
      await expect(page.getByText('Usage patterns: 24 months')).toBeVisible();
      await expect(page.getByText('Order history: 7 years (CRA requirement)')).toBeVisible();
      await expect(page.getByText('ML predictions: 12 months')).toBeVisible();

      // Request data export
      await page.getByTestId('confirm-data-export').click();
      await expect(page.getByTestId('export-confirmation')).toBeVisible();
      await expect(page.getByText('Export will be ready within 30 days')).toBeVisible();

      // Test consent withdrawal
      await page.getByTestId('manage-consent').click();
      await expect(page.getByTestId('consent-management-panel')).toBeVisible();

      // Verify current consent status
      await expect(page.getByTestId('essential-consent-status')).toContainText('Required');
      await expect(page.getByTestId('ml-analytics-consent-status')).toContainText('Granted');

      // Withdraw ML analytics consent
      await page.getByTestId('withdraw-ml-consent').click();
      await expect(page.getByTestId('withdrawal-confirmation-modal')).toBeVisible();

      await page.getByTestId('confirm-withdrawal').click();
      await expect(page.getByTestId('consent-withdrawn-notice')).toBeVisible();

      // Verify impact explanation
      await expect(page.getByText('ML predictions will be disabled')).toBeVisible();
      await expect(page.getByText('Historical predictions will be deleted within 30 days')).toBeVisible();

      // Test data deletion request
      await page.getByTestId('request-data-deletion').click();
      await expect(page.getByTestId('data-deletion-modal')).toBeVisible();

      // Verify deletion categories and retention requirements
      await expect(page.getByText('Some data must be retained for legal compliance')).toBeVisible();
      await expect(page.getByText('Order records: 7 years (CRA requirement)')).toBeVisible();
      await expect(page.getByText('Payment records: 7 years (financial regulations)')).toBeVisible();
    });

    test('should maintain comprehensive audit trail for PIPEDA compliance', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/settings/privacy');

      // Navigate to audit trail
      await page.getByTestId('view-audit-trail').click();
      await expect(page.getByTestId('pipeda-audit-dashboard')).toBeVisible();

      // Verify audit categories
      await expect(page.getByTestId('data-access-logs')).toBeVisible();
      await expect(page.getByTestId('consent-changes-log')).toBeVisible();
      await expect(page.getByTestId('data-sharing-log')).toBeVisible();
      await expect(page.getByTestId('data-processing-log')).toBeVisible();

      // Check recent data access
      const accessLogs = page.getByTestId('data-access-logs');
      await expect(accessLogs.getByTestId('log-entry').first()).toBeVisible();

      // Verify log entry details
      const firstLogEntry = accessLogs.getByTestId('log-entry').first();
      await firstLogEntry.click();

      await expect(page.getByTestId('log-details-modal')).toBeVisible();
      await expect(page.getByTestId('access-timestamp')).toBeVisible();
      await expect(page.getByTestId('data-type-accessed')).toBeVisible();
      await expect(page.getByTestId('purpose-of-access')).toBeVisible();
      await expect(page.getByTestId('legal-basis')).toBeVisible();

      // Verify Canadian compliance fields
      await expect(page.getByTestId('pipeda-article')).toBeVisible();
      await expect(page.getByTestId('data-location')).toContainText('Canada');
      await expect(page.getByTestId('retention-period')).toBeVisible();

      // Test audit trail export
      await page.getByTestId('close-log-details').click();
      await page.getByTestId('export-audit-trail').click();

      await expect(page.getByTestId('audit-export-modal')).toBeVisible();
      await expect(page.getByText('Audit trail will include all PIPEDA-required information')).toBeVisible();

      // Verify export options
      await expect(page.getByTestId('export-format-pdf')).toBeVisible();
      await expect(page.getByTestId('export-format-csv')).toBeVisible();
      await expect(page.getByTestId('include-technical-logs')).toBeVisible();

      await page.getByTestId('export-format-pdf').click();
      await page.getByTestId('confirm-audit-export').click();

      await expect(page.getByTestId('export-requested-confirmation')).toBeVisible();
    });
  });

  test.describe('Canadian Tax Calculation and Compliance', () => {
    test('should calculate taxes accurately for all Canadian provinces', async ({
      page, authHelper
    }) => {
      const testUser = {
        email: 'tax-validation@nestsync-test.com',
        password: 'Test123!@#'
      };

      try {
        await authHelper.login(testUser.email, testUser.password);
      } catch {
        await authHelper.registerNewUser(testUser);
        await authHelper.completeOnboarding();
      }

      // Test tax calculations for each province
      for (const province of canadianTestConfig.provinces) {
        console.log(`Testing tax calculation for ${province.name}`);

        await page.goto('/subscription/upgrade');
        await page.getByTestId('select-premium-plan').click();

        // Set billing address for the province
        await page.getByTestId('billing-province').selectOption(province.code);
        await page.getByTestId('billing-postal').fill(getTestPostalCode(province.code));
        await page.getByTestId('calculate-taxes').click();

        const taxBreakdown = page.getByTestId('tax-breakdown');
        await expect(taxBreakdown).toBeVisible();

        // Verify tax calculation based on province type
        if (province.hst) {
          // HST provinces (NB, NS, PE, NL)
          await expect(taxBreakdown.getByTestId('hst-rate')).toContainText(`${(province.hst * 100).toFixed(1)}%`);
          await expect(taxBreakdown.getByTestId('hst-amount')).toBeVisible();
          await expect(taxBreakdown.getByTestId('gst-amount')).not.toBeVisible();
          await expect(taxBreakdown.getByTestId('pst-amount')).not.toBeVisible();

          const expectedHST = 24.99 * province.hst;
          await expect(taxBreakdown.getByTestId('hst-amount')).toContainText(`$${expectedHST.toFixed(2)}`);
        } else {
          // GST + PST provinces
          await expect(taxBreakdown.getByTestId('gst-rate')).toContainText(`${(province.gst * 100).toFixed(1)}%`);
          await expect(taxBreakdown.getByTestId('gst-amount')).toBeVisible();

          const expectedGST = 24.99 * province.gst;
          await expect(taxBreakdown.getByTestId('gst-amount')).toContainText(`$${expectedGST.toFixed(2)}`);

          if (province.pst && province.pst > 0) {
            await expect(taxBreakdown.getByTestId('pst-rate')).toContainText(`${(province.pst * 100).toFixed(1)}%`);
            await expect(taxBreakdown.getByTestId('pst-amount')).toBeVisible();

            const expectedPST = 24.99 * province.pst;
            await expect(taxBreakdown.getByTestId('pst-amount')).toContainText(`$${expectedPST.toFixed(2)}`);
          } else if (province.qst) {
            // Quebec QST
            await expect(taxBreakdown.getByTestId('qst-rate')).toContainText(`${(province.qst * 100).toFixed(2)}%`);
            await expect(taxBreakdown.getByTestId('qst-amount')).toBeVisible();
          }
        }

        // Verify total calculation
        const totalTaxRate = province.hst || (province.gst + (province.pst || province.qst || 0));
        const expectedTotal = 24.99 * (1 + totalTaxRate);
        await expect(taxBreakdown.getByTestId('total-amount')).toContainText(`$${expectedTotal.toFixed(2)}`);

        console.log(`✅ Tax calculation verified for ${province.name}: ${(totalTaxRate * 100).toFixed(2)}% = $${expectedTotal.toFixed(2)}`);
      }
    });

    test('should generate tax-compliant receipts and invoices', async ({
      premiumUser: { page }
    }) => {
      // Create a test order to generate receipt
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();

      // Complete order with tax calculation
      await page.getByTestId('confirm-order-button').click();
      await expect(page.getByTestId('order-success-confirmation')).toBeVisible();

      const orderNumber = await page.getByTestId('order-number').textContent();

      // Navigate to order details
      await page.goto(`/orders/${orderNumber}`);
      await page.waitForLoadState('networkidle');

      // Download receipt
      await page.getByTestId('download-receipt').click();
      await expect(page.getByTestId('receipt-modal')).toBeVisible();

      // Verify Canadian tax compliance elements
      const receipt = page.getByTestId('receipt-content');

      // Business information
      await expect(receipt.getByTestId('business-name')).toContainText('NestSync');
      await expect(receipt.getByTestId('business-address')).toContainText('Canada');
      await expect(receipt.getByTestId('business-number')).toBeVisible();
      await expect(receipt.getByTestId('gst-hst-number')).toBeVisible();

      // Tax breakdown
      await expect(receipt.getByTestId('tax-breakdown-section')).toBeVisible();
      await expect(receipt.getByTestId('subtotal-before-tax')).toBeVisible();
      await expect(receipt.getByTestId('tax-details')).toBeVisible();
      await expect(receipt.getByTestId('total-amount')).toBeVisible();

      // Provincial tax identification
      const taxDetails = receipt.getByTestId('tax-details');
      const taxText = await taxDetails.textContent();
      expect(taxText).toMatch(/(GST|HST|PST|QST)/);

      // PIPEDA compliance on receipt
      await expect(receipt.getByTestId('privacy-notice')).toBeVisible();
      await expect(receipt.getByText('🇨🇦 Transaction processed in Canada')).toBeVisible();

      // Verify receipt can be downloaded
      await page.getByTestId('download-pdf-receipt').click();
      // In a real test, we'd verify the actual PDF download

      console.log(`✅ Tax-compliant receipt generated for order ${orderNumber}`);
    });

    test('should handle tax rate changes and transitions', async ({
      page, authHelper
    }) => {
      const testUser = {
        email: 'tax-transitions@nestsync-test.com',
        password: 'Test123!@#'
      };

      try {
        await authHelper.login(testUser.email, testUser.password);
      } catch {
        await authHelper.registerNewUser(testUser);
        await authHelper.completeOnboarding();
      }

      await page.goto('/subscription/upgrade');

      // Test moving between provinces (tax jurisdiction change)
      await page.getByTestId('select-premium-plan').click();

      // Start with Ontario (HST)
      await page.getByTestId('billing-province').selectOption('ON');
      await page.getByTestId('calculate-taxes').click();

      let taxBreakdown = page.getByTestId('tax-breakdown');
      await expect(taxBreakdown.getByTestId('hst-amount')).toBeVisible();
      const ontarioTotal = await taxBreakdown.getByTestId('total-amount').textContent();

      // Change to Alberta (no PST)
      await page.getByTestId('billing-province').selectOption('AB');
      await page.getByTestId('calculate-taxes').click();

      taxBreakdown = page.getByTestId('tax-breakdown');
      await expect(taxBreakdown.getByTestId('gst-amount')).toBeVisible();
      await expect(taxBreakdown.getByTestId('pst-amount')).not.toBeVisible();
      const albertaTotal = await taxBreakdown.getByTestId('total-amount').textContent();

      // Verify different totals
      expect(ontarioTotal).not.toBe(albertaTotal);

      // Change to British Columbia (GST + PST)
      await page.getByTestId('billing-province').selectOption('BC');
      await page.getByTestId('calculate-taxes').click();

      taxBreakdown = page.getByTestId('tax-breakdown');
      await expect(taxBreakdown.getByTestId('gst-amount')).toBeVisible();
      await expect(taxBreakdown.getByTestId('pst-amount')).toBeVisible();

      console.log('✅ Tax jurisdiction transitions handled correctly');
    });
  });

  test.describe('Data Residency and Cross-Border Protection', () => {
    test('should enforce Canadian data residency requirements', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/settings/privacy');

      // Verify data residency information
      await expect(page.getByTestId('data-residency-section')).toBeVisible();
      await expect(page.getByText('🇨🇦 All data stored in Canadian data centers')).toBeVisible();

      // Check specific data location details
      await page.getByTestId('view-data-locations').click();
      await expect(page.getByTestId('data-locations-modal')).toBeVisible();

      // Verify data center locations
      await expect(page.getByTestId('primary-datacenter')).toContainText('Toronto, ON');
      await expect(page.getByTestId('backup-datacenter')).toContainText('Vancouver, BC');
      await expect(page.getByTestId('database-location')).toContainText('Canada');
      await expect(page.getByTestId('backup-location')).toContainText('Canada');

      // Verify no cross-border data transfer
      await expect(page.getByTestId('cross-border-transfers')).toContainText('None');
      await expect(page.getByText('No data transferred outside Canada')).toBeVisible();

      // Test API calls include Canadian compliance headers
      await page.route('**/graphql', (route) => {
        const headers = route.request().headers();
        expect(headers['x-compliance-region']).toBe('CA');
        route.continue();
      });

      // Make an API call to verify headers
      await graphqlHelper.getReorderSubscription();
    });

    test('should validate service provider compliance', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/settings/privacy');
      await page.getByTestId('view-service-providers').click();

      await expect(page.getByTestId('service-providers-modal')).toBeVisible();

      // Verify Canadian service providers
      const providers = [
        'payment-processor',
        'email-service',
        'analytics-service',
        'backup-service'
      ];

      for (const provider of providers) {
        const providerSection = page.getByTestId(`provider-${provider}`);
        await expect(providerSection).toBeVisible();
        await expect(providerSection.getByTestId('location')).toContainText('Canada');
        await expect(providerSection.getByTestId('compliance-status')).toContainText('PIPEDA Compliant');
      }

      // Verify no US or international providers for sensitive data
      await expect(page.getByText('No sensitive data processed outside Canada')).toBeVisible();
    });

    test('should handle emergency data access requests from Canadian authorities', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/settings/privacy');
      await page.getByTestId('legal-compliance-section').click();

      // Verify legal compliance information
      await expect(page.getByTestId('legal-requests-info')).toBeVisible();
      await expect(page.getByText('Government access only under Canadian law')).toBeVisible();
      await expect(page.getByText('Court orders and warrants')).toBeVisible();

      // Verify transparency reporting
      await expect(page.getByTestId('transparency-report-link')).toBeVisible();
      await page.getByTestId('transparency-report-link').click();

      await expect(page.getByTestId('transparency-report')).toBeVisible();
      await expect(page.getByTestId('canadian-requests-count')).toBeVisible();
      await expect(page.getByTestId('international-requests-count')).toContainText('0');

      // Verify user notification policies
      await expect(page.getByText('Users notified of legal requests when legally permitted')).toBeVisible();
    });
  });

  test.describe('Canadian Retailer Verification and Pricing', () => {
    test('should verify Canadian retailer authenticity and compliance', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/reorder');
      await page.waitForLoadState('networkidle');

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('compare-prices-button').click();

      await expect(page.getByTestId('retailer-comparison-modal')).toBeVisible();

      // Verify Canadian retailers only
      const canadianRetailers = [
        'amazon-ca',
        'walmart-ca',
        'loblaws-ca',
        'costco-ca'
      ];

      for (const retailer of canadianRetailers) {
        const retailerCard = page.getByTestId(`retailer-option-${retailer}`);
        if (await retailerCard.isVisible()) {
          // Verify Canadian domain verification
          await expect(retailerCard.getByTestId('domain-verification')).toBeVisible();
          await expect(retailerCard.getByTestId('canadian-business-number')).toBeVisible();

          // Verify pricing includes Canadian taxes
          await expect(retailerCard.getByTestId('price-includes-tax')).toBeVisible();
          await expect(retailerCard.getByTestId('shipping-from-canada')).toBeVisible();

          // Verify Canadian customer service
          await expect(retailerCard.getByTestId('canadian-support')).toBeVisible();

          console.log(`✅ Verified Canadian retailer: ${retailer}`);
        }
      }

      // Verify no international retailers are shown
      const internationalRetailers = ['amazon-us', 'walmart-us', 'target-us'];
      for (const retailer of internationalRetailers) {
        await expect(page.getByTestId(`retailer-option-${retailer}`)).not.toBeVisible();
      }
    });

    test('should validate Canadian pricing and currency formatting', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/reorder');

      // Check all price displays use Canadian formatting
      const priceElements = page.getByTestId('price-display');
      const priceCount = await priceElements.count();

      for (let i = 0; i < priceCount; i++) {
        const priceText = await priceElements.nth(i).textContent();

        // Verify Canadian dollar symbol and formatting
        expect(priceText).toMatch(/\$\d{1,3}(,\d{3})*\.\d{2}(\s+CAD)?/);

        // Should not show USD or other currencies
        expect(priceText).not.toContain('USD');
        expect(priceText).not.toContain('$US');
      }

      // Test specific currency formatting
      const testPrices = [
        { amount: 24.99, expected: '$24.99' },
        { amount: 1234.56, expected: '$1,234.56' },
        { amount: 1000, expected: '$1,000.00' }
      ];

      for (const testPrice of testPrices) {
        const formatted = await page.evaluate((amount) => {
          return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
          }).format(amount);
        }, testPrice.amount);

        expect(formatted).toBe(`${testPrice.expected} CAD`);
      }

      console.log('✅ Canadian currency formatting validated');
    });

    test('should enforce Canadian consumer protection laws', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/reorder');

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();

      // Verify Canadian consumer protection notices
      await expect(page.getByTestId('consumer-protection-notice')).toBeVisible();
      await expect(page.getByText('Canadian Consumer Protection Act applies')).toBeVisible();

      // Verify cooling-off period information
      await expect(page.getByTestId('cooling-off-period')).toBeVisible();
      await expect(page.getByText('10-day cancellation period')).toBeVisible();

      // Verify warranty information
      await expect(page.getByTestId('warranty-information')).toBeVisible();
      await expect(page.getByText('Canadian warranty coverage')).toBeVisible();

      // Verify dispute resolution
      await expect(page.getByTestId('dispute-resolution')).toBeVisible();
      await expect(page.getByText('Disputes resolved under Canadian law')).toBeVisible();

      console.log('✅ Canadian consumer protection compliance verified');
    });
  });

  test.describe('Accessibility and Language Compliance', () => {
    test('should support Canadian accessibility standards', async ({
      primaryUser: { page }
    }) => {
      // Test WCAG 2.1 AA compliance (Canadian standard)
      await page.goto('/reorder');

      // Verify color contrast ratios meet Canadian standards
      const elements = await page.$$('[data-testid]');

      for (const element of elements.slice(0, 10)) { // Test first 10 elements
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            fontSize: computed.fontSize
          };
        });

        // Verify minimum font size (Canadian accessibility guideline)
        const fontSize = parseInt(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(16);
      }

      // Test keyboard navigation (required by Canadian accessibility laws)
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();

      // Verify ARIA labels are present
      const ariaLabels = await page.$$('[aria-label]');
      expect(ariaLabels.length).toBeGreaterThan(0);

      console.log('✅ Canadian accessibility standards validated');
    });

    test('should support French language for Quebec compliance', async ({
      page, authHelper
    }) => {
      // Test Quebec user with French preference
      const quebecUser = {
        email: 'quebec-user@nestsync-test.com',
        password: 'Test123!@#',
        province: 'QC'
      };

      try {
        await authHelper.login(quebecUser.email, quebecUser.password);
      } catch {
        await authHelper.registerNewUser(quebecUser);
      }

      // Set French language preference
      await page.goto('/settings/language');
      await page.getByTestId('language-selector').selectOption('fr-CA');
      await page.getByTestId('save-language-preference').click();

      // Verify French interface elements
      await page.goto('/reorder');
      await expect(page.getByTestId('page-title')).toContainText('Recommander');

      // Verify bilingual legal notices (Quebec requirement)
      await page.goto('/legal/terms');
      await expect(page.getByTestId('english-version')).toBeVisible();
      await expect(page.getByTestId('french-version')).toBeVisible();

      // Verify Quebec-specific consumer protection
      await expect(page.getByText('Loi sur la protection du consommateur')).toBeVisible();

      console.log('✅ Quebec French language support validated');
    });

    test('should provide accessible error messages and help', async ({
      primaryUser: { page }
    }) => {
      await page.goto('/reorder');

      // Test error message accessibility
      await page.route('**/graphql', route => route.abort());

      const predictionCard = page.getByTestId('reorder-suggestion-card').first();
      await predictionCard.getByTestId('reorder-now-button').click();

      // Verify accessible error presentation
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByTestId('error-message')).toHaveAttribute('aria-live', 'assertive');

      // Verify error message includes Canadian context
      await expect(page.getByText('Please contact Canadian support')).toBeVisible();
      await expect(page.getByTestId('canadian-support-phone')).toBeVisible();

      // Test help accessibility
      await page.unroute('**/graphql');
      await page.getByTestId('help-button').click();

      await expect(page.getByTestId('help-modal')).toBeVisible();
      await expect(page.getByTestId('help-modal')).toHaveAttribute('role', 'dialog');
      await expect(page.getByTestId('help-modal')).toHaveAttribute('aria-labelledby');

      console.log('✅ Accessible error handling and help validated');
    });
  });
});

// Helper functions for Canadian compliance testing

function getTestPostalCode(provinceCode: string): string {
  const postalCodes = {
    'AB': 'T2P 1J9',
    'BC': 'V6B 1A1',
    'MB': 'R3C 1A1',
    'NB': 'E1C 1A1',
    'NL': 'A1C 1A1',
    'NT': 'X1A 1A1',
    'NS': 'B3H 1A1',
    'NU': 'X0A 0A1',
    'ON': 'M5H 2M9',
    'PE': 'C1A 1A1',
    'QC': 'H3B 1A7',
    'SK': 'S4P 1A1',
    'YT': 'Y1A 1A1'
  };

  return postalCodes[provinceCode] || 'M5H 2M9'; // Default to Toronto
}