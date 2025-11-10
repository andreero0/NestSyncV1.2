/**
 * Design System Compliance Validation Tests
 * 
 * Comprehensive automated tests to validate design system compliance across the application.
 * Tests color usage, typography, spacing, touch targets, and Canadian tax calculations.
 * 
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7
 */

import { test, expect, Page } from '@playwright/test';
import { NestSyncColors } from '../constants/Colors';
import { GlassUITokens } from '../constants/GlassUI';
import {
  CANADIAN_TAX_RATES,
  calculateTaxAmount,
  formatTaxDisplay,
  formatShortTaxDisplay,
  getAllProvinceCodes,
  getProvincialTax,
  isValidProvinceCode
} from '../lib/utils/canadianTax';

// Design system constants
const DESIGN_SYSTEM = {
  spacing: {
    baseUnit: 4,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  touchTarget: {
    minimum: 48,
  },
  typography: {
    sizes: {
      caption: 11,
      small: 12,
      body: 14,
      subtitle: 16,
      title: 20,
      largeTitle: 28,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  colors: NestSyncColors,
};

/**
 * Helper function to convert RGB string to hex
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

/**
 * Helper function to check if color matches design token
 */
function colorMatchesToken(actualColor: string, expectedColor: string): boolean {
  const normalizedActual = actualColor.toUpperCase().replace(/\s/g, '');
  const normalizedExpected = expectedColor.toUpperCase().replace(/\s/g, '');
  
  // Direct match
  if (normalizedActual === normalizedExpected) return true;
  
  // Try converting RGB to hex
  if (normalizedActual.startsWith('RGB')) {
    const hexActual = rgbToHex(actualColor);
    return hexActual === normalizedExpected;
  }
  
  return false;
}

/**
 * Helper function to wait for page to be ready
 */
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

test.describe('Design System Compliance - Color Validation', () => {
  test('Primary buttons use correct primary blue color', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all primary buttons
    const buttons = page.locator('button, [role="button"]').filter({
      has: page.locator('text=/upgrade|subscribe|continue|save|confirm/i')
    });

    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const backgroundColor = await button.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );

      const text = await button.textContent();
      
      if (!colorMatchesToken(backgroundColor, DESIGN_SYSTEM.colors.primary.blue)) {
        violations.push(`Button "${text}" has incorrect background color: ${backgroundColor}`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Success states use correct green color', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find success indicators
    const successElements = page.locator('[data-testid*="success"], .success, [class*="success"]');
    const count = await successElements.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = successElements.nth(i);
      const color = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor || style.color;
      });

      const isGreenColor = 
        colorMatchesToken(color, DESIGN_SYSTEM.colors.secondary.green) ||
        colorMatchesToken(color, DESIGN_SYSTEM.colors.secondary.greenLight);

      if (!isGreenColor && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        violations.push(`Success element has incorrect color: ${color}`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Warning states use correct amber color', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find warning indicators
    const warningElements = page.locator('[data-testid*="warning"], .warning, [class*="warning"]');
    const count = await warningElements.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = warningElements.nth(i);
      const color = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor || style.color;
      });

      const isAmberColor = colorMatchesToken(color, DESIGN_SYSTEM.colors.accent.amber);

      if (!isAmberColor && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        violations.push(`Warning element has incorrect color: ${color}`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Error states use correct red color', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find error indicators
    const errorElements = page.locator('[data-testid*="error"], .error, [class*="error"]');
    const count = await errorElements.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = errorElements.nth(i);
      const color = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor || style.color;
      });

      const isErrorColor = colorMatchesToken(color, DESIGN_SYSTEM.colors.semantic.error);

      if (!isErrorColor && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
        violations.push(`Error element has incorrect color: ${color}`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Text colors use neutral palette', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all text elements
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6, text');
    const count = Math.min(await textElements.count(), 50); // Sample first 50
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      const color = await element.evaluate(el => 
        window.getComputedStyle(el).color
      );

      // Check if color is from neutral palette
      const isNeutralColor = Object.values(DESIGN_SYSTEM.colors.neutral).some(
        neutralColor => colorMatchesToken(color, neutralColor)
      );

      const isPrimaryColor = colorMatchesToken(color, DESIGN_SYSTEM.colors.primary.blue);
      const isSemanticColor = Object.values(DESIGN_SYSTEM.colors.semantic).some(
        semanticColor => colorMatchesToken(color, semanticColor)
      );

      if (!isNeutralColor && !isPrimaryColor && !isSemanticColor && 
          color !== 'rgb(0, 0, 0)' && color !== 'rgb(255, 255, 255)') {
        const text = await element.textContent();
        violations.push(`Text "${text?.substring(0, 30)}" has non-design-system color: ${color}`);
      }
    }

    // Allow some violations for legacy code
    expect(violations.length).toBeLessThan(10);
  });
});

test.describe('Design System Compliance - Typography Validation', () => {
  test('Headings use correct font sizes', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const headings = page.locator('h1, h2, h3, [data-testid*="heading"], [class*="heading"]');
    const count = await headings.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      const fontSize = await heading.evaluate(el => 
        parseInt(window.getComputedStyle(el).fontSize)
      );

      const text = await heading.textContent();
      const validSizes = Object.values(DESIGN_SYSTEM.typography.sizes);

      if (!validSizes.includes(fontSize)) {
        violations.push(`Heading "${text?.substring(0, 30)}" has non-standard font size: ${fontSize}px`);
      }
    }

    // Allow some violations for legacy code
    expect(violations.length).toBeLessThan(5);
  });

  test('Body text uses correct font size', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const bodyText = page.locator('p, span').filter({
      hasNot: page.locator('[class*="heading"], [class*="title"]')
    });
    
    const count = Math.min(await bodyText.count(), 30); // Sample first 30
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = bodyText.nth(i);
      const fontSize = await text.evaluate(el => 
        parseInt(window.getComputedStyle(el).fontSize)
      );

      const content = await text.textContent();
      const validBodySizes = [
        DESIGN_SYSTEM.typography.sizes.caption,
        DESIGN_SYSTEM.typography.sizes.small,
        DESIGN_SYSTEM.typography.sizes.body,
      ];

      if (!validBodySizes.includes(fontSize) && fontSize > 0) {
        violations.push(`Body text "${content?.substring(0, 30)}" has non-standard font size: ${fontSize}px`);
      }
    }

    // Allow some violations for legacy code
    expect(violations.length).toBeLessThan(10);
  });

  test('Font weights use design system values', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const textElements = page.locator('p, span, h1, h2, h3, button, [role="button"]');
    const count = Math.min(await textElements.count(), 50); // Sample first 50
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      const fontWeight = await element.evaluate(el => 
        window.getComputedStyle(el).fontWeight
      );

      const text = await element.textContent();
      const validWeights = Object.values(DESIGN_SYSTEM.typography.weights);

      if (!validWeights.includes(fontWeight) && fontWeight !== 'normal' && fontWeight !== 'bold') {
        violations.push(`Element "${text?.substring(0, 30)}" has non-standard font weight: ${fontWeight}`);
      }
    }

    // Allow some violations for legacy code
    expect(violations.length).toBeLessThan(10);
  });
});

test.describe('Design System Compliance - Spacing Validation', () => {
  test('Element spacing uses 4px base unit', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Check padding and margin of major containers
    const containers = page.locator('[class*="container"], [class*="card"], [class*="section"]');
    const count = Math.min(await containers.count(), 20); // Sample first 20
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const container = containers.nth(i);
      const spacing = await container.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          paddingTop: parseInt(style.paddingTop),
          paddingBottom: parseInt(style.paddingBottom),
          paddingLeft: parseInt(style.paddingLeft),
          paddingRight: parseInt(style.paddingRight),
          marginTop: parseInt(style.marginTop),
          marginBottom: parseInt(style.marginBottom),
        };
      });

      const className = await container.getAttribute('class');
      
      // Check if spacing values are multiples of 4
      Object.entries(spacing).forEach(([property, value]) => {
        if (value > 0 && value % DESIGN_SYSTEM.spacing.baseUnit !== 0) {
          violations.push(`Container "${className}" has ${property}: ${value}px (not multiple of 4px)`);
        }
      });
    }

    // Allow some violations for legacy code or pixel-perfect adjustments
    expect(violations.length).toBeLessThan(15);
  });

  test('Gap between elements uses 4px base unit', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Check gap property on flex/grid containers
    const flexContainers = page.locator('[style*="display: flex"], [style*="display: grid"]');
    const count = Math.min(await flexContainers.count(), 20);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const container = flexContainers.nth(i);
      const gap = await container.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.gap || '0');
      });

      if (gap > 0 && gap % DESIGN_SYSTEM.spacing.baseUnit !== 0) {
        const className = await container.getAttribute('class');
        violations.push(`Flex/Grid container "${className}" has gap: ${gap}px (not multiple of 4px)`);
      }
    }

    // Allow some violations
    expect(violations.length).toBeLessThan(10);
  });

  test('Border radius uses design system values', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Check border radius on buttons and cards
    const roundedElements = page.locator('button, [role="button"], [class*="card"], [class*="rounded"]');
    const count = Math.min(await roundedElements.count(), 30);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = roundedElements.nth(i);
      const borderRadius = await element.evaluate(el => 
        parseInt(window.getComputedStyle(el).borderRadius)
      );

      const text = await element.textContent();
      const validRadii = Object.values(DESIGN_SYSTEM.borderRadius);

      if (borderRadius > 0 && !validRadii.includes(borderRadius)) {
        violations.push(`Element "${text?.substring(0, 30)}" has non-standard border radius: ${borderRadius}px`);
      }
    }

    // Allow some violations for legacy code
    expect(violations.length).toBeLessThan(15);
  });
});

test.describe('Design System Compliance - Touch Target Validation', () => {
  test('All buttons meet 48px minimum touch target height', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const buttons = page.locator('button, [role="button"], a[class*="button"]');
    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box && box.height < DESIGN_SYSTEM.touchTarget.minimum) {
        const text = await button.textContent();
        violations.push(`Button "${text}" has insufficient height: ${box.height}px (minimum: 48px)`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('All buttons meet 48px minimum touch target width', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const buttons = page.locator('button, [role="button"], a[class*="button"]');
    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box && box.width < DESIGN_SYSTEM.touchTarget.minimum) {
        const text = await button.textContent();
        violations.push(`Button "${text}" has insufficient width: ${box.width}px (minimum: 48px)`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Interactive icons meet 48px minimum touch target', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find clickable icons
    const icons = page.locator('[role="button"] svg, button svg').locator('..');
    const count = await icons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i);
      const box = await icon.boundingBox();

      if (box && (box.height < DESIGN_SYSTEM.touchTarget.minimum || box.width < DESIGN_SYSTEM.touchTarget.minimum)) {
        const ariaLabel = await icon.getAttribute('aria-label');
        violations.push(`Icon "${ariaLabel || 'unlabeled'}" has insufficient touch target: ${box.width}x${box.height}px`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Links meet 48px minimum touch target height', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const links = page.locator('a').filter({
      hasNot: page.locator('[class*="text-link"], [class*="inline-link"]')
    });
    
    const count = Math.min(await links.count(), 30);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const box = await link.boundingBox();

      if (box && box.height < DESIGN_SYSTEM.touchTarget.minimum) {
        const text = await link.textContent();
        violations.push(`Link "${text?.substring(0, 30)}" has insufficient height: ${box.height}px`);
      }
    }

    // Allow some violations for inline text links
    expect(violations.length).toBeLessThan(10);
  });
});

test.describe('Design System Compliance - Canadian Tax Calculations', () => {
  test('Tax calculations are accurate for all provinces', () => {
    const testPrice = 4.99;
    const provinces = getAllProvinceCodes();

    provinces.forEach(provinceCode => {
      const result = calculateTaxAmount(testPrice, provinceCode);
      const provincialTax = getProvincialTax(provinceCode);

      // Verify tax amount calculation
      const expectedTaxAmount = (testPrice * provincialTax.totalRate) / 100;
      expect(result.taxAmount).toBeCloseTo(expectedTaxAmount, 2);

      // Verify total price calculation
      const expectedTotalPrice = testPrice + expectedTaxAmount;
      expect(result.totalPrice).toBeCloseTo(expectedTotalPrice, 2);

      // Verify tax rate matches
      expect(result.taxRate).toBe(provincialTax.totalRate);
    });
  });

  test('Ontario HST calculation is correct', () => {
    const result = calculateTaxAmount(4.99, 'ON');
    
    expect(result.basePrice).toBe(4.99);
    expect(result.taxRate).toBe(13);
    expect(result.taxAmount).toBeCloseTo(0.65, 2);
    expect(result.totalPrice).toBeCloseTo(5.64, 2);
    expect(result.provincialTax.displayName).toBe('HST');
  });

  test('British Columbia GST + PST calculation is correct', () => {
    const result = calculateTaxAmount(4.99, 'BC');
    
    expect(result.basePrice).toBe(4.99);
    expect(result.taxRate).toBe(12);
    expect(result.taxAmount).toBeCloseTo(0.60, 2);
    expect(result.totalPrice).toBeCloseTo(5.59, 2);
    expect(result.provincialTax.displayName).toBe('GST + PST');
  });

  test('Alberta GST-only calculation is correct', () => {
    const result = calculateTaxAmount(4.99, 'AB');
    
    expect(result.basePrice).toBe(4.99);
    expect(result.taxRate).toBe(5);
    expect(result.taxAmount).toBeCloseTo(0.25, 2);
    expect(result.totalPrice).toBeCloseTo(5.24, 2);
    expect(result.provincialTax.displayName).toBe('GST');
  });

  test('Quebec GST + QST calculation is correct', () => {
    const result = calculateTaxAmount(4.99, 'QC');
    
    expect(result.basePrice).toBe(4.99);
    expect(result.taxRate).toBe(14.975);
    expect(result.taxAmount).toBeCloseTo(0.75, 2);
    expect(result.totalPrice).toBeCloseTo(5.74, 2);
    expect(result.provincialTax.displayName).toBe('GST + QST');
  });

  test('All Atlantic provinces have 15% HST', () => {
    const atlanticProvinces = ['NB', 'NS', 'PE', 'NL'];
    
    atlanticProvinces.forEach(province => {
      const provincialTax = getProvincialTax(province);
      expect(provincialTax.hst).toBe(15);
      expect(provincialTax.totalRate).toBe(15);
      expect(provincialTax.displayName).toBe('HST');
    });
  });

  test('All territories have 5% GST only', () => {
    const territories = ['YT', 'NT', 'NU'];
    
    territories.forEach(territory => {
      const provincialTax = getProvincialTax(territory);
      expect(provincialTax.gst).toBe(5);
      expect(provincialTax.pst).toBe(0);
      expect(provincialTax.hst).toBe(0);
      expect(provincialTax.totalRate).toBe(5);
      expect(provincialTax.displayName).toBe('GST');
    });
  });

  test('Tax display formatting is correct', () => {
    // Test Ontario HST
    const ontarioDisplay = formatTaxDisplay(4.99, 'ON');
    expect(ontarioDisplay).toContain('5.64');
    expect(ontarioDisplay).toContain('CAD/month');
    expect(ontarioDisplay).toContain('13% HST');

    // Test BC GST + PST
    const bcDisplay = formatTaxDisplay(4.99, 'BC', { showBreakdown: true });
    expect(bcDisplay).toContain('5.59');
    expect(bcDisplay).toContain('5% GST');
    expect(bcDisplay).toContain('7% PST');

    // Test Alberta GST
    const albertaDisplay = formatTaxDisplay(4.99, 'AB');
    expect(albertaDisplay).toContain('5.24');
    expect(albertaDisplay).toContain('5% GST');

    // Test yearly interval
    const yearlyDisplay = formatTaxDisplay(4.99, 'ON', { interval: 'year' });
    expect(yearlyDisplay).toContain('/year');
  });

  test('Short tax display formatting is correct', () => {
    expect(formatShortTaxDisplay('ON')).toBe('13% HST');
    expect(formatShortTaxDisplay('BC')).toBe('12% GST + PST');
    expect(formatShortTaxDisplay('AB')).toBe('5% GST');
    expect(formatShortTaxDisplay('QC')).toContain('GST');
  });

  test('Invalid province codes use default fallback', () => {
    const result = calculateTaxAmount(4.99, 'XX');
    expect(result.taxRate).toBe(13); // Default Ontario HST
    expect(result.provincialTax.displayName).toBe('HST');
  });

  test('Null province codes use default fallback', () => {
    const result = calculateTaxAmount(4.99, null);
    expect(result.taxRate).toBe(13);
    expect(result.provincialTax.displayName).toBe('HST');
  });

  test('Province code validation works correctly', () => {
    expect(isValidProvinceCode('ON')).toBe(true);
    expect(isValidProvinceCode('BC')).toBe(true);
    expect(isValidProvinceCode('XX')).toBe(false);
    expect(isValidProvinceCode(null)).toBe(false);
    expect(isValidProvinceCode('')).toBe(false);
  });

  test('All province codes are returned', () => {
    const provinces = getAllProvinceCodes();
    expect(provinces).toHaveLength(13); // 10 provinces + 3 territories
    expect(provinces).toContain('ON');
    expect(provinces).toContain('BC');
    expect(provinces).toContain('QC');
    expect(provinces).toContain('AB');
  });

  test('Tax rates are within expected ranges', () => {
    const provinces = getAllProvinceCodes();
    
    provinces.forEach(provinceCode => {
      const provincialTax = getProvincialTax(provinceCode);
      
      // Tax rate should be between 5% (GST only) and 15% (HST)
      expect(provincialTax.totalRate).toBeGreaterThanOrEqual(5);
      expect(provincialTax.totalRate).toBeLessThanOrEqual(15);
      
      // GST should be 0 or 5
      expect([0, 5]).toContain(provincialTax.gst);
      
      // PST should be between 0 and 10
      expect(provincialTax.pst).toBeGreaterThanOrEqual(0);
      expect(provincialTax.pst).toBeLessThanOrEqual(10);
      
      // HST should be 0, 13, or 15
      expect([0, 13, 15]).toContain(provincialTax.hst);
    });
  });
});

test.describe('Design System Compliance - Cross-Screen Consistency', () => {
  test('Button styling is consistent across screens', async ({ page }) => {
    const screens = [
      '/',
      '/subscription-management',
      '/reorder-suggestions-simple',
      '/size-guide',
    ];

    const buttonStyles: Record<string, any[]> = {};

    for (const screen of screens) {
      await page.goto(screen);
      await waitForPageReady(page);

      const primaryButtons = page.locator('button, [role="button"]').filter({
        has: page.locator('text=/upgrade|subscribe|continue|save/i')
      });

      const count = Math.min(await primaryButtons.count(), 3);
      
      for (let i = 0; i < count; i++) {
        const button = primaryButtons.nth(i);
        const styles = await button.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            borderRadius: computed.borderRadius,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            padding: computed.padding,
          };
        });

        if (!buttonStyles[screen]) {
          buttonStyles[screen] = [];
        }
        buttonStyles[screen].push(styles);
      }
    }

    // Verify consistency across screens
    const allScreens = Object.keys(buttonStyles);
    if (allScreens.length > 1) {
      const referenceStyles = buttonStyles[allScreens[0]][0];
      
      allScreens.slice(1).forEach(screen => {
        if (buttonStyles[screen].length > 0) {
          const screenStyles = buttonStyles[screen][0];
          
          // Allow some variation but check general consistency
          expect(screenStyles.borderRadius).toBe(referenceStyles.borderRadius);
        }
      });
    }
  });

  test('Card styling is consistent across screens', async ({ page }) => {
    const screens = [
      '/',
      '/reorder-suggestions-simple',
    ];

    const cardStyles: Record<string, any[]> = {};

    for (const screen of screens) {
      await page.goto(screen);
      await waitForPageReady(page);

      const cards = page.locator('[class*="card"], [data-testid*="card"]');
      const count = Math.min(await cards.count(), 3);
      
      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);
        const styles = await card.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            backgroundColor: computed.backgroundColor,
          };
        });

        if (!cardStyles[screen]) {
          cardStyles[screen] = [];
        }
        cardStyles[screen].push(styles);
      }
    }

    // Verify cards have consistent border radius
    const allScreens = Object.keys(cardStyles);
    if (allScreens.length > 1) {
      const referenceRadius = cardStyles[allScreens[0]][0]?.borderRadius;
      
      if (referenceRadius) {
        allScreens.slice(1).forEach(screen => {
          if (cardStyles[screen].length > 0) {
            const screenRadius = cardStyles[screen][0].borderRadius;
            expect(screenRadius).toBe(referenceRadius);
          }
        });
      }
    }
  });
});
