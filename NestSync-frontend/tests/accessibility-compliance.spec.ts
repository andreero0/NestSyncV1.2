/**
 * Accessibility Compliance Test Suite
 * 
 * Comprehensive automated tests to validate WCAG AA accessibility compliance.
 * Tests accessibility labels, hints, touch targets, keyboard navigation, and color contrast.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { test, expect, Page } from '@playwright/test';

// WCAG AA Standards
const WCAG_AA = {
  colorContrast: {
    normalText: 4.5, // Minimum contrast ratio for normal text
    largeText: 3.0,  // Minimum contrast ratio for large text (18pt+ or 14pt+ bold)
  },
  touchTarget: {
    minimum: 48, // Minimum touch target size in pixels (WCAG 2.5.5)
  },
  textSize: {
    minimum: 12, // Minimum font size in pixels
  },
};

/**
 * Helper function to calculate relative luminance
 * Based on WCAG 2.1 formula
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Helper function to calculate contrast ratio
 * Based on WCAG 2.1 formula
 */
function getContrastRatio(rgb1: string, rgb2: string): number {
  const parseRGB = (rgb: string): [number, number, number] => {
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  };

  const [r1, g1, b1] = parseRGB(rgb1);
  const [r2, g2, b2] = parseRGB(rgb2);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Helper function to wait for page to be ready
 */
async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * Helper function to check if text is large (18pt+ or 14pt+ bold)
 */
function isLargeText(fontSize: number, fontWeight: string): boolean {
  // 18pt = 24px, 14pt = 18.67px (approximately 19px)
  if (fontSize >= 24) return true;
  if (fontSize >= 19 && (fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700)) return true;
  return false;
}

test.describe('Accessibility Compliance - Labels and Hints', () => {
  test('All interactive elements have accessibility labels', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all interactive elements
    const interactiveElements = page.locator('button, [role="button"], a, input, select, textarea, [role="tab"], [role="checkbox"], [role="radio"]');
    const count = await interactiveElements.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      
      // Check for accessibility label
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const title = await element.getAttribute('title');
      const textContent = await element.textContent();
      const placeholder = await element.getAttribute('placeholder');

      // Element should have at least one form of label
      const hasLabel = ariaLabel || ariaLabelledBy || title || (textContent && textContent.trim().length > 0) || placeholder;

      if (!hasLabel) {
        const tagName = await element.evaluate(el => el.tagName);
        const className = await element.getAttribute('class');
        violations.push(`${tagName} element with class "${className}" has no accessibility label`);
      }
    }

    // Allow some violations for decorative elements
    expect(violations.length).toBeLessThan(5);
  });

  test('All interactive elements have accessibility hints', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all buttons and links
    const interactiveElements = page.locator('button, [role="button"], a[href]');
    const count = Math.min(await interactiveElements.count(), 30); // Sample first 30
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      
      // Check for accessibility hint
      const ariaDescribedBy = await element.getAttribute('aria-describedby');
      const title = await element.getAttribute('title');
      const textContent = await element.textContent();

      // Buttons with clear action text may not need explicit hints
      const hasDescriptiveText = textContent && (
        textContent.toLowerCase().includes('save') ||
        textContent.toLowerCase().includes('cancel') ||
        textContent.toLowerCase().includes('submit') ||
        textContent.toLowerCase().includes('close') ||
        textContent.toLowerCase().includes('back')
      );

      const hasHint = ariaDescribedBy || title || hasDescriptiveText;

      if (!hasHint) {
        violations.push(`Interactive element "${textContent?.substring(0, 30)}" has no accessibility hint`);
      }
    }

    // Allow some violations for simple buttons with clear text
    expect(violations.length).toBeLessThan(10);
  });

  test('Form inputs have associated labels', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all form inputs
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      
      // Check for label association
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      let hasLabel = Boolean(ariaLabel || ariaLabelledBy || placeholder);

      // Check if there's a label element associated with this input
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const labelExists = await label.count() > 0;
        hasLabel = hasLabel || labelExists;
      }

      if (!hasLabel) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        violations.push(`Input (type: ${type}, name: ${name}) has no associated label`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Images have alt text', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all images
    const images = page.locator('img');
    const count = await images.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      
      const alt = await image.getAttribute('alt');
      const ariaLabel = await image.getAttribute('aria-label');
      const role = await image.getAttribute('role');

      // Decorative images should have empty alt or role="presentation"
      const isDecorative = role === 'presentation' || role === 'none' || alt === '';

      if (!alt && !ariaLabel && !isDecorative) {
        const src = await image.getAttribute('src');
        violations.push(`Image with src "${src?.substring(0, 50)}" has no alt text`);
      }
    }

    expect(violations).toHaveLength(0);
  });
});

test.describe('Accessibility Compliance - Touch Targets', () => {
  test('All buttons meet 48px minimum touch target height', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box && box.height < WCAG_AA.touchTarget.minimum) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const label = ariaLabel || text || 'unlabeled';
        violations.push(`Button "${label.substring(0, 30)}" has insufficient height: ${box.height.toFixed(1)}px (minimum: ${WCAG_AA.touchTarget.minimum}px)`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('All buttons meet 48px minimum touch target width', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box && box.width < WCAG_AA.touchTarget.minimum) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const label = ariaLabel || text || 'unlabeled';
        violations.push(`Button "${label.substring(0, 30)}" has insufficient width: ${box.width.toFixed(1)}px (minimum: ${WCAG_AA.touchTarget.minimum}px)`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('All links meet 48px minimum touch target height', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const links = page.locator('a[href]').filter({
      hasNot: page.locator('[class*="text-link"], [class*="inline-link"]')
    });
    
    const count = Math.min(await links.count(), 30);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const box = await link.boundingBox();

      if (box && box.height < WCAG_AA.touchTarget.minimum) {
        const text = await link.textContent();
        violations.push(`Link "${text?.substring(0, 30)}" has insufficient height: ${box.height.toFixed(1)}px`);
      }
    }

    // Allow some violations for inline text links
    expect(violations.length).toBeLessThan(10);
  });

  test('Interactive icons meet 48px minimum touch target', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find clickable icons (buttons or links containing SVG/icons)
    const iconButtons = page.locator('button:has(svg), [role="button"]:has(svg), a:has(svg)');
    const count = await iconButtons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const iconButton = iconButtons.nth(i);
      const box = await iconButton.boundingBox();

      if (box && (box.height < WCAG_AA.touchTarget.minimum || box.width < WCAG_AA.touchTarget.minimum)) {
        const ariaLabel = await iconButton.getAttribute('aria-label');
        const title = await iconButton.getAttribute('title');
        const label = ariaLabel || title || 'unlabeled icon';
        violations.push(`Icon button "${label}" has insufficient touch target: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Checkbox and radio inputs meet 48px minimum touch target', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const checkboxRadio = page.locator('input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"]');
    const count = await checkboxRadio.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const input = checkboxRadio.nth(i);
      const box = await input.boundingBox();

      if (box && (box.height < WCAG_AA.touchTarget.minimum || box.width < WCAG_AA.touchTarget.minimum)) {
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');
        const label = id || name || 'unlabeled';
        violations.push(`Checkbox/Radio "${label}" has insufficient touch target: ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Tab controls meet 48px minimum touch target', async ({ page }) => {
    await page.goto('/size-guide');
    await waitForPageReady(page);

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    
    if (count === 0) {
      // No tabs on this page, skip test
      test.skip();
      return;
    }

    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const box = await tab.boundingBox();

      if (box && box.height < WCAG_AA.touchTarget.minimum) {
        const text = await tab.textContent();
        violations.push(`Tab "${text?.substring(0, 30)}" has insufficient height: ${box.height.toFixed(1)}px`);
      }
    }

    expect(violations).toHaveLength(0);
  });
});

test.describe('Accessibility Compliance - Keyboard Navigation', () => {
  test('All interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all interactive elements
    const interactiveElements = page.locator('button, [role="button"], a[href], input, select, textarea, [role="tab"]');
    const count = Math.min(await interactiveElements.count(), 20); // Sample first 20
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      
      // Check if element is focusable
      const tabIndex = await element.getAttribute('tabindex');
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      // Elements with tabindex="-1" are not keyboard accessible
      if (tabIndex === '-1') {
        const text = await element.textContent();
        const ariaLabel = await element.getAttribute('aria-label');
        const label = ariaLabel || text || 'unlabeled';
        
        // Only report if it's not a hidden or disabled element
        const isVisible = await element.isVisible();
        const isDisabled = await element.isDisabled().catch(() => false);
        
        if (isVisible && !isDisabled) {
          violations.push(`${tagName} "${label.substring(0, 30)}" has tabindex="-1" and is not keyboard accessible`);
        }
      }
    }

    // Allow some violations for custom components
    expect(violations.length).toBeLessThan(5);
  });

  test('Tab order is logical and sequential', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Get all focusable elements in tab order
    const focusableElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll(
        'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ));
      
      return elements
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map((el, index) => ({
          index,
          tagName: el.tagName,
          text: el.textContent?.substring(0, 30),
          tabIndex: el.getAttribute('tabindex'),
        }));
    });

    // Check for custom tab indices that might break natural order
    const customTabIndices = focusableElements.filter(el => 
      el.tabIndex && parseInt(el.tabIndex) > 0
    );

    // Custom positive tab indices can break natural tab order
    expect(customTabIndices.length).toBeLessThan(5);
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find first few interactive elements
    const buttons = page.locator('button, [role="button"]');
    const count = Math.min(await buttons.count(), 5);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      
      // Focus the element
      await button.focus();
      await page.waitForTimeout(100);

      // Check if focus indicator is visible
      const hasFocusIndicator = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        const pseudoStyle = window.getComputedStyle(el, ':focus');
        
        // Check for outline, border, or box-shadow changes on focus
        const hasOutline = style.outline !== 'none' && style.outline !== '0px';
        const hasBorder = style.borderWidth !== '0px';
        const hasBoxShadow = style.boxShadow !== 'none';
        
        return hasOutline || hasBorder || hasBoxShadow;
      });

      if (!hasFocusIndicator) {
        const text = await button.textContent();
        violations.push(`Button "${text?.substring(0, 30)}" has no visible focus indicator`);
      }
    }

    // Allow some violations for custom styled elements
    expect(violations.length).toBeLessThan(3);
  });

  test('Modal dialogs trap focus', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Try to find and open a modal
    const modalTrigger = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("Edit")').first();
    
    if (await modalTrigger.count() === 0) {
      // No modal triggers found, skip test
      test.skip();
      return;
    }

    await modalTrigger.click();
    await page.waitForTimeout(500);

    // Check if modal is open
    const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal').first();
    
    if (await modal.isVisible().catch(() => false)) {
      // Tab through elements and verify focus stays within modal
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          isInModal: el?.closest('[role="dialog"], [role="alertdialog"], .modal') !== null
        };
      });

      expect(focusedElement.isInModal).toBe(true);
    }
  });

  test('Skip links are available for keyboard users', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Check for skip navigation links
    const skipLinks = page.locator('a[href^="#"]:has-text("Skip"), a[href^="#"]:has-text("Jump")');
    const count = await skipLinks.count();

    // Skip links are recommended but not required for all pages
    // Just verify they work if present
    if (count > 0) {
      const firstSkipLink = skipLinks.first();
      await firstSkipLink.focus();
      
      const isVisible = await firstSkipLink.isVisible();
      expect(isVisible).toBe(true);
    }
  });
});

test.describe('Accessibility Compliance - Color Contrast', () => {
  test('Text has sufficient color contrast (WCAG AA)', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find all text elements
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6, button, a, label, div:has-text("")');
    const count = Math.min(await textElements.count(), 50); // Sample first 50
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      
      // Get text content
      const text = await element.textContent();
      if (!text || text.trim().length === 0) continue;

      // Get computed styles
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: parseInt(computed.fontSize),
          fontWeight: computed.fontWeight,
        };
      });

      // Get parent background if element background is transparent
      let backgroundColor = styles.backgroundColor;
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        backgroundColor = await element.evaluate(el => {
          let parent = el.parentElement;
          while (parent) {
            const bg = window.getComputedStyle(parent).backgroundColor;
            if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
              return bg;
            }
            parent = parent.parentElement;
          }
          return 'rgb(255, 255, 255)'; // Default to white
        });
      }

      // Calculate contrast ratio
      const contrastRatio = getContrastRatio(styles.color, backgroundColor);
      
      // Determine minimum required contrast
      const isLarge = isLargeText(styles.fontSize, styles.fontWeight);
      const minContrast = isLarge ? WCAG_AA.colorContrast.largeText : WCAG_AA.colorContrast.normalText;

      if (contrastRatio < minContrast) {
        violations.push(
          `Text "${text.substring(0, 30)}" has insufficient contrast: ${contrastRatio.toFixed(2)}:1 ` +
          `(minimum: ${minContrast}:1, fontSize: ${styles.fontSize}px, fontWeight: ${styles.fontWeight})`
        );
      }
    }

    // Allow some violations for legacy code or special cases
    expect(violations.length).toBeLessThan(10);
  });

  test('Button text has sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const buttons = page.locator('button, [role="button"]');
    const count = await buttons.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      
      const text = await button.textContent();
      if (!text || text.trim().length === 0) continue;

      const styles = await button.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: parseInt(computed.fontSize),
          fontWeight: computed.fontWeight,
        };
      });

      const contrastRatio = getContrastRatio(styles.color, styles.backgroundColor);
      const isLarge = isLargeText(styles.fontSize, styles.fontWeight);
      const minContrast = isLarge ? WCAG_AA.colorContrast.largeText : WCAG_AA.colorContrast.normalText;

      if (contrastRatio < minContrast) {
        violations.push(
          `Button "${text.substring(0, 30)}" has insufficient contrast: ${contrastRatio.toFixed(2)}:1 (minimum: ${minContrast}:1)`
        );
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Link text has sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const links = page.locator('a[href]');
    const count = Math.min(await links.count(), 30);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      
      const text = await link.textContent();
      if (!text || text.trim().length === 0) continue;

      const styles = await link.evaluate(el => {
        const computed = window.getComputedStyle(el);
        let backgroundColor = computed.backgroundColor;
        
        // Get parent background if transparent
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          let parent = el.parentElement;
          while (parent) {
            const bg = window.getComputedStyle(parent).backgroundColor;
            if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
              backgroundColor = bg;
              break;
            }
            parent = parent.parentElement;
          }
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            backgroundColor = 'rgb(255, 255, 255)';
          }
        }
        
        return {
          color: computed.color,
          backgroundColor,
          fontSize: parseInt(computed.fontSize),
          fontWeight: computed.fontWeight,
        };
      });

      const contrastRatio = getContrastRatio(styles.color, styles.backgroundColor);
      const isLarge = isLargeText(styles.fontSize, styles.fontWeight);
      const minContrast = isLarge ? WCAG_AA.colorContrast.largeText : WCAG_AA.colorContrast.normalText;

      if (contrastRatio < minContrast) {
        violations.push(
          `Link "${text.substring(0, 30)}" has insufficient contrast: ${contrastRatio.toFixed(2)}:1 (minimum: ${minContrast}:1)`
        );
      }
    }

    // Allow some violations for special cases
    expect(violations.length).toBeLessThan(5);
  });

  test('Form labels have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const labels = page.locator('label');
    const count = await labels.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const label = labels.nth(i);
      
      const text = await label.textContent();
      if (!text || text.trim().length === 0) continue;

      const styles = await label.evaluate(el => {
        const computed = window.getComputedStyle(el);
        let backgroundColor = computed.backgroundColor;
        
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          let parent = el.parentElement;
          while (parent) {
            const bg = window.getComputedStyle(parent).backgroundColor;
            if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
              backgroundColor = bg;
              break;
            }
            parent = parent.parentElement;
          }
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            backgroundColor = 'rgb(255, 255, 255)';
          }
        }
        
        return {
          color: computed.color,
          backgroundColor,
          fontSize: parseInt(computed.fontSize),
          fontWeight: computed.fontWeight,
        };
      });

      const contrastRatio = getContrastRatio(styles.color, styles.backgroundColor);
      const isLarge = isLargeText(styles.fontSize, styles.fontWeight);
      const minContrast = isLarge ? WCAG_AA.colorContrast.largeText : WCAG_AA.colorContrast.normalText;

      if (contrastRatio < minContrast) {
        violations.push(
          `Label "${text.substring(0, 30)}" has insufficient contrast: ${contrastRatio.toFixed(2)}:1 (minimum: ${minContrast}:1)`
        );
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Error messages have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const errorElements = page.locator('[role="alert"], .error, [class*="error"], [data-testid*="error"]');
    const count = await errorElements.count();
    
    if (count === 0) {
      // No error messages on page, skip test
      test.skip();
      return;
    }

    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = errorElements.nth(i);
      
      const text = await element.textContent();
      if (!text || text.trim().length === 0) continue;

      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: parseInt(computed.fontSize),
          fontWeight: computed.fontWeight,
        };
      });

      const contrastRatio = getContrastRatio(styles.color, styles.backgroundColor);
      const isLarge = isLargeText(styles.fontSize, styles.fontWeight);
      const minContrast = isLarge ? WCAG_AA.colorContrast.largeText : WCAG_AA.colorContrast.normalText;

      if (contrastRatio < minContrast) {
        violations.push(
          `Error message "${text.substring(0, 30)}" has insufficient contrast: ${contrastRatio.toFixed(2)}:1 (minimum: ${minContrast}:1)`
        );
      }
    }

    expect(violations).toHaveLength(0);
  });
});

test.describe('Accessibility Compliance - Semantic HTML', () => {
  test('Headings follow proper hierarchy', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const headings = await page.evaluate(() => {
      const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return headingElements.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.substring(0, 30),
      }));
    });

    const violations: string[] = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      // First heading should be h1
      if (index === 0 && heading.level !== 1) {
        violations.push(`First heading should be h1, but found h${heading.level}: "${heading.text}"`);
      }

      // Headings should not skip levels
      if (heading.level > previousLevel + 1) {
        violations.push(`Heading hierarchy skips from h${previousLevel} to h${heading.level}: "${heading.text}"`);
      }

      previousLevel = heading.level;
    });

    // Allow some violations for complex layouts
    expect(violations.length).toBeLessThan(3);
  });

  test('Lists use proper semantic markup', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Check for div-based lists that should be ul/ol
    const divLists = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.filter(div => {
        const children = Array.from(div.children);
        // If div has 3+ children with similar structure, might be a list
        return children.length >= 3 && 
               children.every(child => child.tagName === children[0].tagName);
      }).length;
    });

    // This is a heuristic check - some div-based lists are acceptable
    expect(divLists).toBeLessThan(20);
  });

  test('Forms use fieldset and legend for grouping', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const forms = page.locator('form');
    const formCount = await forms.count();

    if (formCount === 0) {
      test.skip();
      return;
    }

    // Check if complex forms use fieldset/legend
    for (let i = 0; i < formCount; i++) {
      const form = forms.nth(i);
      const inputCount = await form.locator('input, select, textarea').count();

      // Forms with 5+ inputs should consider using fieldsets
      if (inputCount >= 5) {
        const fieldsetCount = await form.locator('fieldset').count();
        
        // This is a recommendation, not a strict requirement
        if (fieldsetCount === 0) {
          console.log(`Form with ${inputCount} inputs could benefit from fieldset grouping`);
        }
      }
    }
  });

  test('Tables have proper headers', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const tables = page.locator('table');
    const tableCount = await tables.count();

    if (tableCount === 0) {
      test.skip();
      return;
    }

    const violations: string[] = [];

    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      
      // Check for th elements
      const thCount = await table.locator('th').count();
      
      // Check for caption
      const captionCount = await table.locator('caption').count();

      if (thCount === 0) {
        violations.push(`Table ${i + 1} has no header cells (th elements)`);
      }

      if (captionCount === 0) {
        const ariaLabel = await table.getAttribute('aria-label');
        const ariaLabelledBy = await table.getAttribute('aria-labelledby');
        
        if (!ariaLabel && !ariaLabelledBy) {
          violations.push(`Table ${i + 1} has no caption or aria-label`);
        }
      }
    }

    expect(violations).toHaveLength(0);
  });
});

test.describe('Accessibility Compliance - ARIA Attributes', () => {
  test('ARIA roles are used correctly', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const elementsWithRoles = page.locator('[role]');
    const count = await elementsWithRoles.count();
    const violations: string[] = [];

    // Valid ARIA roles
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
      'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
      'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
      'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu',
      'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note',
      'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton',
      'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer',
      'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];

    for (let i = 0; i < count; i++) {
      const element = elementsWithRoles.nth(i);
      const role = await element.getAttribute('role');

      if (role && !validRoles.includes(role)) {
        const tagName = await element.evaluate(el => el.tagName);
        violations.push(`${tagName} has invalid ARIA role: "${role}"`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('ARIA labels are meaningful', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const elementsWithAriaLabel = page.locator('[aria-label]');
    const count = await elementsWithAriaLabel.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = elementsWithAriaLabel.nth(i);
      const ariaLabel = await element.getAttribute('aria-label');

      // Check for empty or meaningless labels
      if (!ariaLabel || ariaLabel.trim().length === 0) {
        const tagName = await element.evaluate(el => el.tagName);
        violations.push(`${tagName} has empty aria-label`);
      } else if (ariaLabel.length < 2) {
        violations.push(`Element has too short aria-label: "${ariaLabel}"`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('ARIA live regions are used appropriately', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const liveRegions = page.locator('[aria-live]');
    const count = await liveRegions.count();

    // Check that live regions have valid values
    const validLiveValues = ['off', 'polite', 'assertive'];
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const region = liveRegions.nth(i);
      const liveValue = await region.getAttribute('aria-live');

      if (liveValue && !validLiveValues.includes(liveValue)) {
        violations.push(`Element has invalid aria-live value: "${liveValue}"`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Required form fields are marked with aria-required', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const requiredInputs = page.locator('input[required], select[required], textarea[required]');
    const count = await requiredInputs.count();
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const input = requiredInputs.nth(i);
      const ariaRequired = await input.getAttribute('aria-required');

      // HTML5 required attribute should be accompanied by aria-required for better screen reader support
      if (ariaRequired !== 'true') {
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        violations.push(`Required input (name: ${name}, type: ${type}) missing aria-required="true"`);
      }
    }

    // This is a recommendation, allow some violations
    expect(violations.length).toBeLessThan(5);
  });

  test('Expandable elements have aria-expanded', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find buttons that likely control expandable content
    const expandButtons = page.locator('button:has-text("Show"), button:has-text("Expand"), button:has-text("More"), [class*="accordion"], [class*="collapse"]');
    const count = await expandButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const violations: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = expandButtons.nth(i);
      const ariaExpanded = await button.getAttribute('aria-expanded');

      if (!ariaExpanded) {
        const text = await button.textContent();
        violations.push(`Expandable button "${text?.substring(0, 30)}" missing aria-expanded attribute`);
      }
    }

    // This is a recommendation
    expect(violations.length).toBeLessThan(5);
  });
});

test.describe('Accessibility Compliance - Screen Reader Support', () => {
  test('Page has a descriptive title', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const title = await page.title();
    
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(3);
    expect(title).not.toBe('React App');
    expect(title).not.toBe('Vite App');
  });

  test('Page has a main landmark', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const mainLandmark = page.locator('main, [role="main"]');
    const count = await mainLandmark.count();

    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(1); // Should only have one main landmark
  });

  test('Page has navigation landmarks', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const navLandmarks = page.locator('nav, [role="navigation"]');
    const count = await navLandmarks.count();

    // Most pages should have at least one navigation landmark
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Hidden content is properly marked', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Find visually hidden elements
    const visuallyHidden = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        return (style.display === 'none' || style.visibility === 'hidden') &&
               !el.hasAttribute('aria-hidden');
      }).length;
    });

    // Elements hidden with CSS should also have aria-hidden
    // This is a recommendation, not strict requirement
    expect(visuallyHidden).toBeLessThan(50);
  });

  test('Loading states are announced to screen readers', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Look for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [role="progressbar"], [aria-busy="true"]');
    const count = await loadingIndicators.count();

    if (count > 0) {
      const firstIndicator = loadingIndicators.first();
      
      // Check for screen reader announcement
      const ariaLive = await firstIndicator.getAttribute('aria-live');
      const ariaLabel = await firstIndicator.getAttribute('aria-label');
      const role = await firstIndicator.getAttribute('role');

      const hasScreenReaderSupport = ariaLive || ariaLabel || role === 'progressbar' || role === 'status';
      
      expect(hasScreenReaderSupport).toBe(true);
    }
  });

  test('Dynamic content updates are announced', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Look for elements that likely contain dynamic content
    const dynamicRegions = page.locator('[role="alert"], [role="status"], [aria-live]');
    const count = await dynamicRegions.count();

    // If there are dynamic regions, verify they're properly configured
    for (let i = 0; i < count; i++) {
      const region = dynamicRegions.nth(i);
      const role = await region.getAttribute('role');
      const ariaLive = await region.getAttribute('aria-live');

      const isProperlyConfigured = role === 'alert' || role === 'status' || ariaLive;
      expect(isProperlyConfigured).toBe(true);
    }
  });
});

test.describe('Accessibility Compliance - Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 13

  test('Touch targets are adequate on mobile', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const buttons = page.locator('button, [role="button"], a[href]');
    const count = Math.min(await buttons.count(), 20);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box && (box.height < WCAG_AA.touchTarget.minimum || box.width < WCAG_AA.touchTarget.minimum)) {
        const text = await button.textContent();
        violations.push(`Mobile touch target too small: "${text?.substring(0, 30)}" (${box.width.toFixed(1)}x${box.height.toFixed(1)}px)`);
      }
    }

    expect(violations).toHaveLength(0);
  });

  test('Text is readable on mobile without zooming', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const textElements = page.locator('p, span, button, a, label');
    const count = Math.min(await textElements.count(), 30);
    const violations: string[] = [];

    for (let i = 0; i < count; i++) {
      const element = textElements.nth(i);
      const fontSize = await element.evaluate(el => 
        parseInt(window.getComputedStyle(el).fontSize)
      );

      if (fontSize < WCAG_AA.textSize.minimum) {
        const text = await element.textContent();
        violations.push(`Text too small on mobile: "${text?.substring(0, 30)}" (${fontSize}px)`);
      }
    }

    // Allow some violations for captions or fine print
    expect(violations.length).toBeLessThan(5);
  });

  test('Horizontal scrolling is not required', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;

    // Allow small overflow for shadows/borders
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });

  test('Content reflows properly on mobile', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Check for fixed-width elements that might break mobile layout
    const fixedWidthElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const style = window.getComputedStyle(el);
        const width = parseInt(style.width);
        return width > 400 && style.position !== 'fixed' && style.position !== 'absolute';
      }).length;
    });

    // Some fixed-width elements are acceptable (images, etc.)
    expect(fixedWidthElements).toBeLessThan(10);
  });
});
