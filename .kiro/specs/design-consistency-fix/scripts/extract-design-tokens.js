/**
 * Design System Audit - Design Token Extraction
 * 
 * This script extracts computed styles from reference screens to document
 * the established design system tokens (colors, typography, spacing, etc.).
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:19006';
const OUTPUT_FILE = path.join(__dirname, '../design-tokens-reference.json');
const VIEWPORT = { width: 375, height: 812 };

// Test credentials
const TEST_USER = {
  email: 'test@nestsync.ca',
  password: 'TestPassword123!'
};

/**
 * Extract computed styles from an element
 */
async function extractElementStyles(element) {
  return await element.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      // Colors
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderColor: computed.borderColor,
      
      // Typography
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontFamily: computed.fontFamily,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      
      // Spacing
      padding: computed.padding,
      paddingTop: computed.paddingTop,
      paddingRight: computed.paddingRight,
      paddingBottom: computed.paddingBottom,
      paddingLeft: computed.paddingLeft,
      margin: computed.margin,
      marginTop: computed.marginTop,
      marginRight: computed.marginRight,
      marginBottom: computed.marginBottom,
      marginLeft: computed.marginLeft,
      gap: computed.gap,
      
      // Layout
      display: computed.display,
      flexDirection: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
      
      // Visual
      borderRadius: computed.borderRadius,
      borderWidth: computed.borderWidth,
      boxShadow: computed.boxShadow,
      opacity: computed.opacity,
      
      // Dimensions
      width: computed.width,
      height: computed.height,
      minWidth: computed.minWidth,
      minHeight: computed.minHeight,
      
      // Element info
      tagName: el.tagName,
      className: el.className,
      id: el.id
    };
  });
}

/**
 * Convert RGB to Hex
 */
function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') {
    return null;
  }
  
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return rgb;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : 1;
  
  const hex = '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  
  return a < 1 ? `${hex} (${Math.round(a * 100)}%)` : hex;
}

/**
 * Analyze and categorize extracted styles
 */
function analyzeStyles(styles) {
  const tokens = {
    colors: {
      primary: new Set(),
      semantic: new Set(),
      neutral: new Set(),
      text: new Set(),
      background: new Set(),
      border: new Set()
    },
    typography: {
      sizes: new Set(),
      weights: new Set(),
      lineHeights: new Set(),
      families: new Set()
    },
    spacing: {
      padding: new Set(),
      margin: new Set(),
      gap: new Set()
    },
    borders: {
      radius: new Set(),
      width: new Set()
    },
    shadows: new Set(),
    dimensions: {
      width: new Set(),
      height: new Set(),
      minWidth: new Set(),
      minHeight: new Set()
    }
  };
  
  styles.forEach(style => {
    // Colors
    if (style.color) tokens.colors.text.add(rgbToHex(style.color));
    if (style.backgroundColor) tokens.colors.background.add(rgbToHex(style.backgroundColor));
    if (style.borderColor) tokens.colors.border.add(rgbToHex(style.borderColor));
    
    // Typography
    if (style.fontSize) tokens.typography.sizes.add(style.fontSize);
    if (style.fontWeight) tokens.typography.weights.add(style.fontWeight);
    if (style.lineHeight) tokens.typography.lineHeights.add(style.lineHeight);
    if (style.fontFamily) tokens.typography.families.add(style.fontFamily);
    
    // Spacing
    if (style.paddingTop && style.paddingTop !== '0px') tokens.spacing.padding.add(style.paddingTop);
    if (style.paddingRight && style.paddingRight !== '0px') tokens.spacing.padding.add(style.paddingRight);
    if (style.paddingBottom && style.paddingBottom !== '0px') tokens.spacing.padding.add(style.paddingBottom);
    if (style.paddingLeft && style.paddingLeft !== '0px') tokens.spacing.padding.add(style.paddingLeft);
    if (style.marginTop && style.marginTop !== '0px') tokens.spacing.margin.add(style.marginTop);
    if (style.gap && style.gap !== 'normal' && style.gap !== '0px') tokens.spacing.gap.add(style.gap);
    
    // Borders
    if (style.borderRadius && style.borderRadius !== '0px') tokens.borders.radius.add(style.borderRadius);
    if (style.borderWidth && style.borderWidth !== '0px') tokens.borders.width.add(style.borderWidth);
    
    // Shadows
    if (style.boxShadow && style.boxShadow !== 'none') tokens.shadows.add(style.boxShadow);
    
    // Dimensions
    if (style.width && !style.width.includes('auto')) tokens.dimensions.width.add(style.width);
    if (style.height && !style.height.includes('auto')) tokens.dimensions.height.add(style.height);
    if (style.minWidth && style.minWidth !== '0px') tokens.dimensions.minWidth.add(style.minWidth);
    if (style.minHeight && style.minHeight !== '0px') tokens.dimensions.minHeight.add(style.minHeight);
  });
  
  // Convert Sets to sorted Arrays
  const result = {};
  Object.keys(tokens).forEach(category => {
    result[category] = {};
    Object.keys(tokens[category]).forEach(subcategory => {
      result[category][subcategory] = Array.from(tokens[category][subcategory])
        .filter(v => v !== null && v !== 'null')
        .sort();
    });
  });
  
  return result;
}

async function extractDesignTokens() {
  console.log('🎨 Starting Design Token Extraction\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Login if needed
    const isLoginPage = await page.locator('text=Sign In').isVisible().catch(() => false);
    
    if (isLoginPage) {
      console.log('🔐 Logging in...');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    const allStyles = [];
    const screens = [
      { name: 'Home', url: '/' },
      { name: 'Settings', url: '/profile-settings' }
    ];
    
    for (const screen of screens) {
      console.log(`\n📊 Extracting tokens from ${screen.name} screen...`);
      await page.goto(`${BASE_URL}${screen.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      
      // Extract styles from various component types
      // React Native Web uses div elements with specific classes
      const selectors = [
        'div[role="button"]',
        'div[role="heading"]',
        'div[class*="text"]',
        'div[class*="Text"]',
        'div[class*="view"]',
        'div[class*="View"]',
        'div[class*="button"]',
        'div[class*="Button"]',
        'div[class*="card"]',
        'div[class*="Card"]',
        'div[class*="container"]',
        'div[class*="Container"]',
        'button',
        'input',
        'a'
      ];
      
      for (const selector of selectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          console.log(`   Found ${count} ${selector} elements`);
          
          // Extract from first few instances
          const limit = Math.min(count, 5);
          for (let i = 0; i < limit; i++) {
            try {
              const element = elements.nth(i);
              if (await element.isVisible().catch(() => false)) {
                const styles = await extractElementStyles(element);
                styles.screen = screen.name;
                styles.selector = selector;
                allStyles.push(styles);
              }
            } catch (error) {
              // Skip elements that can't be accessed
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Extracted styles from ${allStyles.length} elements`);
    
    // Analyze and categorize tokens
    console.log('\n🔍 Analyzing design tokens...');
    const tokens = analyzeStyles(allStyles);
    
    // Create comprehensive output
    const output = {
      metadata: {
        extractedAt: new Date().toISOString(),
        totalElements: allStyles.length,
        screens: screens.map(s => s.name),
        viewport: VIEWPORT
      },
      tokens,
      rawStyles: allStyles
    };
    
    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n✨ Design tokens saved to: ${OUTPUT_FILE}`);
    
    // Print summary
    console.log('\n📋 Token Summary:');
    console.log(`   Colors: ${Object.values(tokens.colors).reduce((sum, arr) => sum + arr.length, 0)} unique values`);
    console.log(`   Typography Sizes: ${tokens.typography.sizes.length} unique values`);
    console.log(`   Spacing Values: ${tokens.spacing.padding.length + tokens.spacing.margin.length} unique values`);
    console.log(`   Border Radius: ${tokens.borders.radius.length} unique values`);
    console.log(`   Shadows: ${tokens.shadows.length} unique values`);
    
  } catch (error) {
    console.error('❌ Error extracting design tokens:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the extraction
extractDesignTokens().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
